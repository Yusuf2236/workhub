import SwiftUI

struct ApplicationsView: View {
    @State private var applications: [Application] = []
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && applications.isEmpty {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Arizalar yuklanmoqda...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else if applications.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundColor(.blue)

                        Text("Arizalar mavjud emas")
                            .font(.headline)
                            .fontWeight(.black)

                        Text("Siz hali hech qanday vakansiyaga ariza topshirmagansiz. Vakansiyalar bo‘limidan o‘zingizga mos ish toping va ariza yuboring.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                } else {
                    List(applications) { app in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(app.company ?? "Kompaniya")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(6)

                                Spacer()

                                statusBadge(for: app.status ?? "submitted")
                            }

                            Text(app.vacancyTitle ?? "Vakansiya")
                                .font(.headline)
                                .fontWeight(.black)

                            HStack {
                                Text("Topshirildi: \(app.createdAt ?? "Hozirgina")")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("ID: \(app.id.prefix(8))")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                    .listStyle(.insetGrouped)
                    .refreshable {
                        await loadApplicationsAsync()
                    }
                }
            }
            .navigationTitle("Mening Arizalarim")
            .onAppear {
                loadApplications()
            }
        }
    }

    @ViewBuilder
    private func statusBadge(for status: String) -> some View {
        let (text, bg, fg): (String, Color, Color) = {
            switch status.lowercased() {
            case "accepted", "approved":
                return ("Qabul qilindi / Taklif", Color.green.opacity(0.15), Color.green)
            case "reviewed", "in_review":
                return ("Ko‘rib chiqilmoqda", Color.orange.opacity(0.15), Color.orange)
            case "rejected":
                return ("Rad etildi", Color.red.opacity(0.15), Color.red)
            default:
                return ("Yuborildi", Color.blue.opacity(0.15), Color.blue)
            }
        }()

        Text(text)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(bg)
            .foregroundColor(fg)
            .cornerRadius(6)
    }

    private func loadApplications() {
        Task {
            await loadApplicationsAsync()
        }
    }

    private func loadApplicationsAsync() async {
        isLoading = true
        do {
            let items = try await APIClient.shared.fetchApplications()
            await MainActor.run {
                self.applications = items
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
}
