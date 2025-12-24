import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatedMessageResponseDto } from './dtos/created-message-response.dto';

@ApiTags('Message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @ApiOperation({ summary: 'Enviar un mensaje a un usuario' })
  @ApiCreatedResponse({ description: 'Created message', type: CreatedMessageResponseDto })
  @ApiForbiddenResponse({ description: 'User must be journey owner or passenger' })
  @ApiNotFoundResponse({ description: 'Journey not found' })
  @ApiBadRequestResponse({ description: 'Sender and receiver cannot be the same, journey must be pending' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while sending message' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Post('send')
  async send(@Body() { receiverId, journeyId, content }: SendMessageDto, @ActiveUser() { id: senderId }: ActiveUserInterface) {
    return this.messageService.sendMessage(senderId, receiverId, journeyId, content);
  }
}
