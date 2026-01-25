import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { filter, fromEvent, map, merge } from 'rxjs';
import { Brackets, Repository } from 'typeorm';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { JourneyService } from '../journey/journey.service';
import { UserService } from '../user/user.service';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
        private readonly journeyService: JourneyService,
        private readonly userService: UserService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async sendMessage(senderId: string, journeyId: string, content: string, receiverId?: string) {
        try {
            // Usamos el nuevo método getById que ya devuelve la estructura mapeada (user, passengers, etc.)
            const journey = await this.journeyService.getById(journeyId);

            if (!journey) {
                this.logger.warn(`[MESSAGE_SEND_NOT_FOUND] - Journey: ${journeyId} - Sender: ${senderId}`);
                throw new NotFoundException('Journey not found');
            }

            // Los mensajes usualmente solo se permiten si el viaje no está cancelado
            if (journey.status === JourneyStatus.CANCELLED) throw new BadRequestException('Cannot send messages in a cancelled journey');

            const driverId = journey.user.id;
            const isDriver = senderId === driverId;

            if (isDriver) {
                if (!receiverId) {
                    throw new BadRequestException('Receiver ID is required for journey drivers');
                }
            } else {
                if (receiverId && receiverId !== driverId) throw new BadRequestException('Passengers can only message the driver');
                receiverId = driverId;
            }

            await this.verifyUserIsParticipant(journey, senderId, receiverId);

            if (senderId === receiverId) throw new BadRequestException('Sender and receiver cannot be the same');

            const message = this.messageRepository.create({
                content,
                sender: { id: senderId },
                receiver: { id: receiverId },
                journey: { id: journeyId }
            });

            const savedMessage = await this.messageRepository.save(message);

            // Emitimos para el stream (SSE)
            this.eventEmitter.emit('message.created', {
                ...savedMessage,
                senderId,
                receiverId,
                journeyId
            });

            this.logger.log(`[MESSAGE_SENT_SUCCESS] - From: ${senderId} To: ${receiverId} - Journey: ${journeyId}`);

            return savedMessage;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[MESSAGE_SEND_ERROR] - Sender: ${senderId} - Journey: ${journeyId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error sending message");
        }

    }

    async getChatHistory(journeyId: string, currentUser: string, userB?: string, limit: number = 20, offset: number = 0) {
        try {
            if (currentUser === userB) throw new BadRequestException('Sender and receiver cannot be the same');

            const journey = await this.journeyService.getById(journeyId);
            if (!journey) {
                this.logger.warn(`[CHAT_HISTORY_NOT_FOUND] - Journey: ${journeyId}`);
                throw new NotFoundException('Journey not found');
            }
            const isDriver = journey.user.id === currentUser;

            if (isDriver) {
                if (!userB) throw new BadRequestException('UserB (passenger) ID is required for journey drivers');
                await this.userService.getUserById(userB);
            } else {
                userB = journey.user.id; // El pasajero siempre habla con el conductor
            }

            await this.verifyUserIsParticipant(journey, currentUser, userB);

            const messages = await this.messageRepository.createQueryBuilder('message')
                .select([
                    'message.id',
                    'message.content',
                    'message.isRead',
                    'message.createdAt',
                    'sender.id',
                    'sender.name',
                    'sender.lastname',
                    'senderProfile.image',
                    'receiver.id',
                    'receiver.name',
                    'receiver.lastname',
                    'receiverProfile.image'
                ])
                .leftJoin('message.sender', 'sender')
                .leftJoin('sender.profile', 'senderProfile')
                .leftJoin('message.receiver', 'receiver')
                .leftJoin('receiver.profile', 'receiverProfile')
                .where('message.journey.id = :journeyId', { journeyId })
                .andWhere(new Brackets(qb => {
                    qb.where('(message.sender.id = :currentUser AND message.receiver.id = :userB)', { currentUser, userB })
                        .orWhere('(message.sender.id = :userB AND message.receiver.id = :currentUser)', { currentUser, userB });
                }))
                .orderBy('message.createdAt', 'DESC')
                .take(limit)
                .skip(offset)
                .getMany();

            this.logger.log(`[CHAT_HISTORY_FETCHED] - Journey: ${journeyId} - Between: ${currentUser} and ${userB} - Count: ${messages.length}`);

            return messages;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[CHAT_HISTORY_ERROR] - Journey: ${journeyId} - User: ${currentUser} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving chat history");
        }

    }

    private async verifyUserIsParticipant(journey: any, senderId: string, receiverId: string) {
        try {
            const passengersIds = journey.passengers?.map((p: any) => p.id) || [];
            const driverId = journey.user.id;

            const isSenderParticipant = senderId === driverId || passengersIds.includes(senderId);
            const isReceiverParticipant = receiverId === driverId || passengersIds.includes(receiverId);

            if (!isSenderParticipant || !isReceiverParticipant) {
                this.logger.warn(
                    `[MESSAGE_SECURITY_VIOLATION] - Unauthorized chat attempt in Journey: ${journey.id}. ` +
                    `Sender(${senderId}): ${isSenderParticipant}, Receiver(${receiverId}): ${isReceiverParticipant}`
                );
                throw new ForbiddenException('One or both users are not participants of this journey');
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_PARTICIPANT_ERROR] - Journey: ${journey.id} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying chat participants");
        }

    }

    async deleteMessage(messageId: string, userId: string) {
        try {
            const message = await this.messageRepository.findOne({
                where: { id: messageId },
                relations: ['sender', 'receiver', 'journey']
            });

            if (!message) {
                this.logger.warn(`[MESSAGE_DELETE_NOT_FOUND] - ID: ${messageId} - Attempted by: ${userId}`);
                throw new NotFoundException('Message not found');
            }

            if (message.sender.id !== userId) {
                this.logger.warn(`[MESSAGE_DELETE_FORBIDDEN] - ID: ${messageId} - User ${userId} is not the sender`);
                throw new ForbiddenException('Only sender can delete the message');
            }

            await this.messageRepository.softDelete(message.id);

            this.eventEmitter.emit('message.deleted', {
                id: messageId,
                journeyId: message.journey.id,
                receiverId: message.receiver.id,
                senderId: message.sender.id
            });

            this.logger.log(`[MESSAGE_DELETED_SUCCESS] - ID: ${messageId} - Sender: ${userId}`);

            return { success: true };
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[MESSAGE_DELETE_ERROR] - ID: ${messageId} - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error deleting message");
        }
    }

    async streamMessages(userId: string) {
        try {
            this.logger.log(`[SSE_CONNECTION_ESTABLISHED] - User: ${userId} started listening to messages`);

            const created$ = fromEvent(this.eventEmitter, 'message.created').pipe(
                map(data => ({ data, type: 'message.created' }))
            );

            const deleted$ = fromEvent(this.eventEmitter, 'message.deleted').pipe(
                map(data => ({ data, type: 'message.deleted' }))
            );

            return merge(created$, deleted$).pipe(
                filter(({ data }: any) => data.receiverId === userId || data.senderId === userId),
                map(({ data, type }) => ({ data, type })),
            );
        } catch (error) {
            this.logger.error(
                `[SSE_STREAM_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error establishing message stream");
        }
    }
}