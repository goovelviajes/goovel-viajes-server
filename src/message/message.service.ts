import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Journey } from 'src/journey/entities/journey.entity';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { JourneyStatus } from 'src/journey/enums/journey-status.enum';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
        @InjectRepository(Journey) private readonly journeyRepository: Repository<Journey>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async sendMessage(senderId: string, receiverId: string, journeyId: string, content: string) {
        const journey = await this.journeyRepository.findOne({
            where: { id: journeyId },
            relations: ['user', 'bookings', 'bookings.user']
        });

        if (!journey) throw new NotFoundException('Journey not found');

        if (journey.status !== JourneyStatus.PENDING) throw new BadRequestException('Journey is not pending');

        const driverId = journey.user.id;
        const passengersId = journey.bookings.map((b) => b.user.id);

        const isSenderParticipant = senderId === driverId || passengersId.includes(senderId);
        const isReceiverParticipant = receiverId === driverId || passengersId.includes(receiverId);

        if (senderId === receiverId) throw new BadRequestException('Sender and receiver cannot be the same');

        if (!isSenderParticipant || !isReceiverParticipant) throw new ForbiddenException('User is not a participant of the journey');

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
}
