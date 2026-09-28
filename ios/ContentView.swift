import SwiftUI

struct ContentView: View {
    @State private var isLoggedIn = true
    @State private var selectedTab = 0
    @State private var isWebMirrorMode = false
    @State private var isWebLoading = false

    var body: some View {
        Group {
            if isWebMirrorMode {
                ZStack(alignment: .topTrailing) {
                    WorkHubWebView(
                        url: URL(string: "http://localhost:3000")!,
                        isLoading: $isWebLoading
                    )
                    .ignoresSafeArea(.all, edges: .bottom)

                    // Switch back to Native floating badge
                    Button(action: {
                        withAnimation(.spring()) {
                            isWebMirrorMode = false
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "iphone")
                            Text("Native UI")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.ultraThinMaterial)
                        .cornerRadius(20)
                        .shadow(radius: 5)
                        .padding(.trailing, 16)
                        .padding(.top, 10)
                    }
                }
            } else if isLoggedIn {
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
                .tint(Color.blue)
                .overlay(alignment: .topTrailing) {
                    // Quick toggle to Web Mirror (100% sayt bilan sinxron)
                    Button(action: {
                        withAnimation(.spring()) {
                            isWebMirrorMode = true
                        }
                    }) {
                        HStack(spacing: 5) {
                            Image(systemName: "globe")
                            Text("Jonli Sayt")
                                .font(.system(size: 10, weight: .black))
                        }
                        .foregroundColor(.blue)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color(.systemBackground).opacity(0.85))
                        .clipShape(Capsule())
                        .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
                        .padding(.trailing, 16)
                        .padding(.top, 8)
                    }
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
