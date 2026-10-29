import SwiftUI

struct ChatView: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputMessage = ""
    @State private var isLoading = false
    @State private var isSending = false

    var body: some View {
        VStack {
            if isLoading && messages.isEmpty {
                Spacer()
                ProgressView("Xabarlar yuklanmoqda...")
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(messages) { msg in
                                HStack {
                                    if msg.isMe { Spacer() }

                                    VStack(alignment: msg.isMe ? .trailing : .leading, spacing: 4) {
                                        if !msg.isMe {
                                            Text(msg.senderName ?? "Foydalanuvchi")
                                                .font(.caption2)
                                                .fontWeight(.bold)
                                                .foregroundColor(.blue)
                                        }

                                        Text(msg.content)
                                            .font(.body)
                                            .foregroundColor(msg.isMe ? .white : .primary)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 10)
                                            .background(msg.isMe ? Color.blue : Color(.systemGray6))
                                            .cornerRadius(16)

                                        Text(msg.createdAt ?? "Hozirgina")
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                    .id(msg.id)

                                    if !msg.isMe { Spacer() }
                                }
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            withAnimation {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }
            }

            Divider()

            HStack {
                TextField("Xabar yozing...", text: $inputMessage)
                    .textFieldStyle(.roundedBorder)

                Button(action: sendMessage) {
                    if isSending {
                        ProgressView()
                    } else {
                        Text("Yuborish")
                            .bold()
                    }
                }
                .disabled(inputMessage.trimmingCharacters(in: .whitespaces).isEmpty || isSending)
            }
            .padding()
        }
        .navigationTitle("Jonli Muloqot")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadMessages()
        }
    }

    private func loadMessages() {
        isLoading = true
        Task {
            do {
                let items = try await APIClient.shared.fetchChatMessages(room: "general")
                await MainActor.run {
                    self.messages = items
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    if self.messages.isEmpty {
                        self.messages = [
                            ChatMessage(id: "1", roomId: "general", userId: "r1", senderName: "WorkHub HR", senderAvatar: nil, content: "Assalomu alaykum! WorkHub platformasiga xush kelibsiz. Savollaringiz bormi?", isMe: false, createdAt: "10:30"),
                            ChatMessage(id: "2", roomId: "general", userId: SessionManager.shared.currentUser?.id, senderName: SessionManager.shared.currentUser?.name, senderAvatar: nil, content: "Assalomu alaykum! Ha, vakansiyalarga ariza topshirish bo‘yicha tanishib chiqmoqdaman.", isMe: true, createdAt: "10:32")
                        ]
                    }
                    self.isLoading = false
                }
            }
        }
    }

    private func sendMessage() {
        let content = inputMessage.trimmingCharacters(in: .whitespaces)
        guard !content.isEmpty else { return }

        isSending = true
        inputMessage = ""

        Task {
            do {
                let newMsg = try await APIClient.shared.sendChatMessage(room: "general", content: content)
                await MainActor.run {
                    self.messages.append(newMsg)
                    self.isSending = false
                }
            } catch {
                await MainActor.run {
                    // Fallback
                    let fallback = ChatMessage(
                        id: UUID().uuidString,
                        roomId: "general",
                        userId: SessionManager.shared.currentUser?.id,
                        senderName: SessionManager.shared.currentUser?.name ?? "Men",
                        senderAvatar: nil,
                        content: content,
                        isMe: true,
                        createdAt: "Hozirgina"
                    )
                    self.messages.append(fallback)
                    self.isSending = false
                }
            }
        }
    }
}
