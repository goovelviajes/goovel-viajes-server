import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Journey } from '../journey/entities/journey.entity';
import { Brackets, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { JourneyStatus } from '../journey/enums/journey-status.enum';
import { UserService } from 'src/user/user.service';
import { JourneyService } from '../journey/journey.service';
import { filter, fromEvent, map } from 'rxjs';

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

    async getChatHistory(journeyId: string, currentUser: string, userB?: string) {
        if (currentUser === userB) throw new BadRequestException('Sender and receiver cannot be the same');

        const journey = await this.journeyService.getJourneyByIdWithBookings(journeyId);

        if (!journey) throw new NotFoundException('Journey not found');

        const isDriver = journey.user.id === currentUser;

        // Si el usuario actual es el conductor, entonces el usuario B es el pasajero
        if (isDriver) {
            if (!userB) throw new BadRequestException('UserB field is required for journey drivers');

            // Validamos que el usuario B sea participante del viaje
            await this.verifyUserIsParticipant(journey, currentUser, userB);
        }

        // Si el usuario actual es el pasajero, entonces el usuario B es el conductor
        if (!isDriver) {
            if (userB) throw new BadRequestException('UserB field is not required for passengers');
            userB = journey.user.id;
        }

        // Validamos que el usuario B exista
        if (userB) await this.userService.getUserById(userB);

        const db = await this.messageRepository.createQueryBuilder('message')
            .select([
                'message.id',
                'message.content',
                'message.createdAt',
                'message.isRead'
            ])
            // Obtenemos el usuario que envio el mensaje
            .leftJoin('message.sender', 'sender')
            .addSelect([
                'sender.id',
                'sender.name',
                'sender.lastname'
            ])

            // Obtenemos la imagen del usuario que envio el mensaje
            .leftJoin('sender.profile', 'senderProfile')
            .addSelect([
                'senderProfile.id',
                'senderProfile.image'
            ])

            // Obtenemos el usuario que recibe el mensaje
            .leftJoin('message.receiver', 'receiver')
            .addSelect([
                'receiver.id',
                'receiver.name',
                'receiver.lastname'
            ])

            // Obtenemos la imagen del usuario que recibe el mensaje
            .leftJoin('receiver.profile', 'receiverProfile')
            .addSelect([
                'receiverProfile.id',
                'receiverProfile.image'
            ])

            // Filtramos por el viaje, el usuario que envia y el usuario que recibe el mensaje
            .where('message.journey.id = :journeyId', { journeyId })

            .andWhere(new Brackets(qb => {
                qb.where('(message.sender.id = :currentUser AND message.receiver.id = :userB)', { currentUser, userB })
                    .orWhere('(message.sender.id = :userB AND message.receiver.id = :currentUser)', { currentUser, userB });
            }))

            .orderBy('message.createdAt', 'ASC')

            .getMany()

        return db;
    }

    private async verifyUserIsParticipant(journey: Journey, senderId: string, receiverId: string) {
        const passengersId = journey.bookings.map((b) => b.user.id);

        const isSenderParticipant = senderId === journey.user.id || passengersId.includes(senderId);
        const isReceiverParticipant = receiverId === journey.user.id || passengersId.includes(receiverId);


        if (!isSenderParticipant || !isReceiverParticipant) throw new ForbiddenException('User is not a participant of the journey');
    }

    async streamMessages(userId: string) {
        return fromEvent(this.eventEmitter, 'message.created').pipe(
            filter((msg: any) => msg.receiver.id === userId),
            map((msg: any) => ({ data: msg }))
        );
    }
}
