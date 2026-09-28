import SwiftUI

struct MessageBubble: Identifiable {
    let id = UUID()
    let text: String
    let isMe: BooleanLiteralType
    let time: String
}

struct ChatView: View {
    @State private var messages: [MessageBubble] = [
        MessageBubble(text: "Hello! We reviewed your Go Backend resume. Are you available for a chat?", isMe: false, time: "10:30"),
        MessageBubble(text: "Hello! Yes, absolutely. I am ready anytime tomorrow.", isMe: true, time: "10:32")
    ]
    @State private var inputMessage = ""

    var body: some View {
        VStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(messages) { msg in
                        HStack {
                            if msg.isMe { Spacer() }

                            VStack(alignment: msg.isMe ? .trailing : .leading, spacing: 4) {
                                Text(msg.text)
                                    .font(.body)
                                    .foregroundColor(msg.isMe ? .white : .primary)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(msg.isMe ? Color.blue : Color(.systemGray6))
                                    .cornerRadius(16)

                                Text(msg.time)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }

                            if !msg.isMe { Spacer() }
                        }
                    }
                }
                .padding()
            }

            Divider()

            HStack {
                TextField("Type a message...", text: $inputMessage)
                    .textFieldStyle(.roundedBorder)

                Button("Send") {
                    if !inputMessage.trimmingCharacters(in: .whitespaces).isEmpty {
                        messages.append(MessageBubble(text: inputMessage, isMe: true, time: "Now"))
                        inputMessage = ""
                    }
                }
                .bold()
            }
            .padding()
        }
        .navigationTitle("Recruiter Chat")
        .navigationBarTitleDisplayMode(.inline)
    }
}
