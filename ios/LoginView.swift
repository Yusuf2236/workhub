import SwiftUI

struct LoginView: View {
    var onLoginSuccess: () -> Void

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack(spacing: 20) {
            Text("WorkHub")
                .font(.largeTitle)
                .bold()

            TextField("Email", text: $email)
                .textFieldStyle(.roundedBorder)

            SecureField("Password", text: $password)
                .textFieldStyle(.roundedBorder)

            Button("Login") {
                onLoginSuccess()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    LoginView(onLoginSuccess: {})
}
