import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { filter, fromEvent, map, merge } from 'rxjs';
import { UserService } from 'src/user/user.service';
import { Brackets, Repository } from 'typeorm';
import { Journey } from '../journey/entities/journey.entity';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { JourneyService } from '../journey/journey.service';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
        private readonly journeyService: JourneyService,
        private readonly userService: UserService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async sendMessage(senderId: string, journeyId: string, content: string, receiverId?: string) {
        const journey = await this.journeyService.getJourneyByIdWithBookings(journeyId);

        if (!journey) throw new NotFoundException('Journey not found');

        if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException('Journey is not pending');

        const driverId = journey.user.id;
        const isDriver = senderId === driverId;

        if (isDriver) {
            if (!receiverId) {
                throw new BadRequestException('Receiver ID is required for journey drivers');
            }
        } else {
            if (receiverId) throw new BadRequestException('Receiver ID is not required for passengers');
            receiverId = driverId
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

        this.eventEmitter.emit('message.created', savedMessage);

        return savedMessage;
    }

    async getChatHistory(journeyId: string, currentUser: string, userB?: string, limit: number = 20, offset: number = 0) {
        if (currentUser === userB) throw new BadRequestException('Sender and receiver cannot be the same');

        const journey = await this.journeyService.getJourneyByIdWithBookings(journeyId);
        if (!journey) throw new NotFoundException('Journey not found');

        const isDriver = journey.user.id === currentUser;

        // Si el usuario actual es el conductor, entonces el usuario B es el pasajero
        if (isDriver) {
            if (!userB) throw new BadRequestException('UserB field is required for journey drivers');
            // Validamos que el usuario B exista
            await this.userService.getUserById(userB);
        } else {
            // Si el usuario actual es el pasajero, entonces el usuario B es el conductor
            if (userB) throw new BadRequestException('UserB field is not required for passengers');
            userB = journey.user.id;
        }

        // Validamos que el usuario B sea participante del viaje
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
                'senderProfile.id',
                'senderProfile.image',
                'receiver.id',
                'receiver.name',
                'receiver.lastname',
                'receiverProfile.id',
                'receiverProfile.image'
            ])
            .leftJoin('message.sender', 'sender')
            .leftJoin('sender.profile', 'senderProfile')
            .leftJoin('message.receiver', 'receiver')
            .leftJoin('receiver.profile', 'receiverProfile')
            // 1. Filtramos por el viaje
            .where('message.journey.id = :journeyId', { journeyId })
            // 2. Filtramos para que solo traiga el "mano a mano" entre el conductor y el pasajero
            .andWhere(new Brackets(qb => {
                qb.where('(message.sender.id = :currentUser AND message.receiver.id = :userB)', { currentUser, userB })
                    .orWhere('(message.sender.id = :userB AND message.receiver.id = :currentUser)', { currentUser, userB });
            }))
            // 3. Orden y Paginación
            .orderBy('message.createdAt', 'DESC')
            .take(limit)
            .skip(offset)
            .getMany();

        return messages;
    }

    private async verifyUserIsParticipant(journey: Journey, senderId: string, receiverId: string) {
        const passengersId = journey.bookings.map((b) => b.user.id) || [];

        const isSenderParticipant = senderId === journey.user.id || passengersId.includes(senderId);
        const isReceiverParticipant = receiverId === journey.user.id || passengersId.includes(receiverId);


        if (!isSenderParticipant || !isReceiverParticipant) throw new ForbiddenException('User is not a participant of the journey');
    }

    async deleteMessage(messageId: string, userId: string) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'receiver', 'journey']
        });

        if (!message) throw new NotFoundException('Message not found');

        // Validar propiedad: Solo el que lo envió puede borrarlo
        if (message.sender.id !== userId) {
            throw new ForbiddenException('Only sender can delete the message');
        }

        await this.messageRepository.softDelete(message.id);

        // Emitir evento para que el Front del receptor actualice la UI
        this.eventEmitter.emit('message.deleted', {
            id: messageId,
            journeyId: message.journey.id,
            receiverId: message.receiver.id,
            senderId: message.sender.id
        });

        return { success: true };
    }

    async streamMessages(userId: string) {
        // Escuchamos ambos eventos por separado
        const created$ = fromEvent(this.eventEmitter, 'message.created').pipe(
            map(data => ({ data, type: 'message.created' }))
        );

        const deleted$ = fromEvent(this.eventEmitter, 'message.deleted').pipe(
            map(data => ({ data, type: 'message.deleted' }))
        );

        // Combinamos ambos flujos
        return merge(created$, deleted$).pipe(
            filter(({ data }: any) => data.receiverId === userId || data.senderId === userId),
            map(({ data, type }) => ({
                data,
                type, // Aquí es donde Postman leerá la etiqueta naranja que ves en tu captura
            })),
        );
    }
}
