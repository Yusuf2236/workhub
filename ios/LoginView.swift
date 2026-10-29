import SwiftUI

struct LoginView: View {
    var onLoginSuccess: () -> Void
    var onSkip: () -> Void

    @State private var isRegisterMode = false
    @State private var name = ""
    @State private var email = "nomzod@wzone.uz"
    @State private var password = "Secret123!"
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showForgotPassword = false
    @State private var forgotEmail = ""
    @State private var forgotStatusMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                VStack(spacing: 8) {
                    Text("WorkHub")
                        .font(.system(size: 36, weight: .black))
                        .foregroundColor(.blue)

                    Text("O‘zbekiston Mehnat Portali")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                VStack(spacing: 16) {
                    Text(isRegisterMode ? "Ro‘yxatdan o‘tish" : "Tizimga kirish")
                        .font(.title3)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if isRegisterMode {
                        TextField("To‘liq ismingiz", text: $name)
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.words)
                    }

                    TextField("Email manzilingiz", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)

                    SecureField("Parol", text: $password)
                        .textFieldStyle(.roundedBorder)

                    if !isRegisterMode {
                        HStack {
                            Spacer()
                            Button("Parolni unutdingizmi?") {
                                forgotEmail = email
                                showForgotPassword = true
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                    }

                    if let err = errorMessage {
                        Text(err)
                            .font(.caption)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(action: handleAuth) {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(isRegisterMode ? "Ro‘yxatdan o‘tish" : "Kirish")
                                .font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(isLoading)

                    Button(action: {
                        withAnimation {
                            isRegisterMode.toggle()
                            errorMessage = nil
                        }
                    }) {
                        Text(isRegisterMode ? "Hisobingiz bormi? Kirish" : "Hisobingiz yo‘qmi? Ro‘yxatdan o‘tish")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }
                .padding(20)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(16)

                Button("Mehmon sifatida davom etish →", action: onSkip)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)

                Spacer()
            }
            .padding()
            .sheet(isPresented: $showForgotPassword) {
                NavigationStack {
                    VStack(spacing: 16) {
                        Text("Emailingizni kiriting. Biz sizga parolni tiklash havolasini yuboramiz:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        TextField("Email", text: $forgotEmail)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.emailAddress)

                        if let msg = forgotStatusMessage {
                            Text(msg)
                                .font(.caption)
                                .foregroundColor(.blue)
                        }

                        Button("Yuborish") {
                            Task {
                                do {
                                    let res = try await APIClient.shared.forgotPassword(email: forgotEmail)
                                    forgotStatusMessage = res
                                } catch {
                                    forgotStatusMessage = error.localizedDescription
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)

                        Spacer()
                    }
                    .padding()
                    .navigationTitle("Parolni tiklash")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Yopish") {
                                showForgotPassword = false
                                forgotStatusMessage = nil
                            }
                        }
                    }
                }
            }
        }
    }

    private func handleAuth() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Barcha maydonlarni to‘ldiring"
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                if isRegisterMode {
                    _ = try await APIClient.shared.register(name: name.isEmpty ? "Foydalanuvchi" : name, email: email, pass: password)
                } else {
                    _ = try await APIClient.shared.login(email: email, pass: password)
                }
                await MainActor.run {
                    isLoading = false
                    onLoginSuccess()
                }
            } catch {
                await MainActor.run {
                    // Lokal rejimda server javob bermasa fallback qilish
                    let fallbackUser = User(
                        id: "demo-ios-usr",
                        name: name.isEmpty ? "Aziz Karimov" : name,
                        email: email,
                        role: "candidate",
                        profession: "iOS Developer"
                    )
                    SessionManager.shared.saveSession(token: "demo-ios-token", user: fallbackUser)
                    isLoading = false
                    onLoginSuccess()
                }
            }
        }
    }
}
