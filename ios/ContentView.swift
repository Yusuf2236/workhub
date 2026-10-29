import SwiftUI

struct ContentView: View {
    @ObservedObject var session = SessionManager.shared
    @State private var selectedTab = 0
    @State private var isWebMirrorMode = false
    @State private var isWebLoading = false
    @State private var isSplashActive = true
    @State private var splashScale: CGFloat = 0.7
    @State private var splashOpacity: Double = 1.0

    var body: some View {
        ZStack {
            Group {
                if isWebMirrorMode {
                    ZStack(alignment: .topTrailing) {
                        WorkHubWebView(
                            url: APIConfig.webURL,
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
                } else if session.isLoggedIn {
                    WZoneMainView()
                    .overlay(alignment: .topTrailing) {
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
                        // SessionManager yangilanishi bilan o'tadi
                    }, onSkip: {
                        let guest = User(id: "guest", name: "Mehmon", email: "guest@workhub.uz", role: "guest")
                        session.saveSession(token: "guest-token", user: guest)
                    })
                }
            }

            // MARK: - Native WZone Launch Splash Animation (W ochiladi, kattalashadi)
            if isSplashActive {
                ZStack {
                    Color(red: 0.05, green: 0.02, blue: 0.10)
                        .ignoresSafeArea()

                    // Glow aura
                    Circle()
                        .fill(Color(red: 0.42, green: 0.28, blue: 0.85).opacity(0.35))
                        .frame(width: 280, height: 280)
                        .blur(radius: 50)

                    VStack(spacing: 16) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 30)
                                .fill(LinearGradient(
                                    colors: [Color(red: 0.35, green: 0.15, blue: 0.75), Color(red: 0.42, green: 0.28, blue: 0.85), Color(red: 0.60, green: 0.40, blue: 1.0)],
                                    startPoint: .bottomLeading,
                                    endPoint: .topTrailing
                                ))
                                .frame(width: 96, height: 96)
                                .shadow(color: Color(red: 0.42, green: 0.28, blue: 0.85).opacity(0.8), radius: 25, x: 0, y: 0)

                            Text("W")
                                .font(.system(size: 58, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                        }
                        .scaleEffect(splashScale)
                        .opacity(splashOpacity)

                        if splashScale < 2.0 {
                            VStack(spacing: 4) {
                                Text("WZone")
                                    .font(.system(size: 22, weight: .black))
                                    .foregroundColor(.white)
                                Text("O‘zbekiston vakansiyalar platformasi")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(Color.purple.opacity(0.8))
                            }
                            .transition(.opacity)
                        }
                    }
                }
                .transition(.opacity)
                .onAppear {
                    // Step 1: gentle spring appearance
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                        splashScale = 1.0
                    }

                    // Step 2: zoom in & expand towards camera after 1s
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        withAnimation(.easeInOut(duration: 0.75)) {
                            splashScale = 15.0
                            splashOpacity = 0.0
                        }
                    }

                    // Step 3: dismiss splash overlay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.55) {
                        withAnimation(.easeOut(duration: 0.35)) {
                            isSplashActive = false
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
