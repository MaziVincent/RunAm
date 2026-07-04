class ChatMessageDto {
  final String id;
  final String errandId;
  final String senderId;
  final String senderName;
  final String? text;
  final String? imageUrl;
  final DateTime createdAt;
  final bool isRead;

  ChatMessageDto({
    required this.id,
    required this.errandId,
    required this.senderId,
    required this.senderName,
    this.text,
    this.imageUrl,
    required this.createdAt,
    required this.isRead,
  });

  factory ChatMessageDto.fromJson(Map<String, dynamic> json) {
    return ChatMessageDto(
      id: json['id'] as String,
      errandId: json['errandId'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      text: json['text'] as String?,
      imageUrl: json['imageUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      isRead: json['isRead'] as bool,
    );
  }
}

class SendMessageRequest {
  final String? text;
  final String? imageUrl;

  SendMessageRequest({
    this.text,
    this.imageUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'imageUrl': imageUrl,
    };
  }
}
