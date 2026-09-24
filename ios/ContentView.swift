import SwiftUI

struct ContentView: View {
    @State private var isLoggedIn = false

    var body: some View {
        Group {
            if isLoggedIn {
                HomeView()
            } else {
                LoginView(onLoginSuccess: {
                    isLoggedIn = true
                })
            }
        }
    }
}

#Preview {
    ContentView()
}
