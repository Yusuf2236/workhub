import SwiftUI

@main
struct WorkHubApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(appState.dark ? .dark : .light)
                .tint(appState.accent)
                .animation(.easeInOut(duration: 0.45), value: appState.dark)
        }
    }
}
