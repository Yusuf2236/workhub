import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Featured jobs") {
                    Text("Senior Go Engineer")
                    Text("Remote • Berlin")
                }

                Section("Application status") {
                    Text("2 new matches")
                }
            }
            .navigationTitle("Dashboard")
        }
    }
}

#Preview {
    HomeView()
}
