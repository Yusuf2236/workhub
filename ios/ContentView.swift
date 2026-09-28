import SwiftUI

struct ContentView: View {
    @State private var isLoggedIn = true
    @State private var selectedTab = 0

    var body: some View {
        Group {
            if isLoggedIn {
                TabView(selection: $selectedTab) {
                    HomeView()
                        .tabItem {
                            Label("Bosh sahifa", systemImage: "house.fill")
                        }
                        .tag(0)

                    VacancyListView()
                        .tabItem {
                            Label("Vakansiyalar", systemImage: "briefcase.fill")
                        }
                        .tag(1)

                    ChatView()
                        .tabItem {
                            Label("Chat", systemImage: "message.fill")
                        }
                        .tag(2)

                    ProfileView(onLogout: {
                        isLoggedIn = false
                    })
                    .tabItem {
                        Label("Profil", systemImage: "person.crop.circle.fill")
                    }
                    .tag(3)
                }
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
