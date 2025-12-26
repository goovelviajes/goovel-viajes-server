import { Body, Controller, Get, ParseUUIDPipe, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { CreatedMessageResponseDto } from './dtos/created-message-response.dto';
import { MessageOkResponseDto } from './dtos/message-ok-response.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { MessageService } from './message.service';

@ApiTags('Message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @ApiOperation({ summary: 'Enviar un mensaje a un usuario' })
  @ApiCreatedResponse({ description: 'Created message', type: CreatedMessageResponseDto })
  @ApiForbiddenResponse({ description: 'User must be journey owner or passenger' })
  @ApiNotFoundResponse({ description: 'Journey not found' })
  @ApiBadRequestResponse({ description: 'Sender and receiver cannot be the same, journey must be pending, receiver ID is required for journey drivers, receiver ID is not required for passengers' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while sending message' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Post('send')
  async send(@Body() { receiverId, journeyId, content }: SendMessageDto, @ActiveUser() { id: senderId }: ActiveUserInterface) {
    return this.messageService.sendMessage(senderId, journeyId, content, receiverId);
  }

  @ApiOperation({ summary: 'Obtener el historial de chat con otro usuario' })
  @ApiOkResponse({ description: 'Chat history', type: [MessageOkResponseDto] })
  @ApiBadRequestResponse({ description: 'Sender and receiver cannot be the same, userB field is required for journey drivers, userB field is not required for passengers' })
  @ApiNotFoundResponse({ description: 'Journey or user not found' })
  @ApiForbiddenResponse({ description: 'User must be journey owner or passenger' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting chat history' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Get('chat-history')
  async getChatHistory(
    @Query('journeyId', ParseUUIDPipe) journeyId: string,
    @ActiveUser() { id: currentUser }: ActiveUserInterface,
    @Query('userB') userB: string) {
    return this.messageService.getChatHistory(journeyId, currentUser, userB);
  }

  @ApiOperation({
    summary: 'Stream de mensajes en tiempo real',
    description: 'Establece una conexión persistente (SSE) para recibir mensajes nuevos dirigidos al usuario autenticado.'
  })
  @ApiOkResponse({
    description: 'Conexión exitosa. El servidor enviará eventos de tipo "message.created".',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        content: { type: 'string' },
        createdAt: { type: 'string' },
        isRead: { type: 'boolean' },
        sender: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            lastname: { type: 'string' },
            profile: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                image: { type: 'string' },
              },
            },
          },
        },
        receiver: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            lastname: { type: 'string' },
            profile: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                image: { type: 'string' },
              },
            },
          },
        },
        journey: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @Sse('stream')
  @UseGuards(TokenGuard)
  streamMessages(@ActiveUser() { id: userId }: ActiveUserInterface) {
    return this.messageService.streamMessages(userId);
  }

}
