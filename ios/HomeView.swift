import SwiftUI

struct HomeView: View {
    let vacancies = [
        Vacancy(id: "1", title: "Senior Go Backend Architect", company: "WorkHub Global", location: "Tashkent / Remote", description: "Designing high-concurrency microservices, PostgreSQL, and Redis caching systems.", salary: "$4000 - $6000"),
        Vacancy(id: "2", title: "Mobile iOS Lead", company: "Mobile Studio", location: "Remote", description: "Native SwiftUI architecture and WebSocket integrations.", salary: "$3500 - $5000"),
        Vacancy(id: "3", title: "Cloud Infrastructure Specialist", company: "InfraCorp", location: "Tashkent", description: "Managing Kubernetes clusters, MinIO storage, and Docker pipelines.", salary: "$3000 - $4500")
    ]

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink(destination: ChatView()) {
                        HStack {
                            Image(systemName: "message.fill")
                                .foregroundColor(.blue)
                            VStack(alignment: .leading) {
                                Text("Recruiter Messages")
                                    .font(.headline)
                                Text("1 unread message")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Text("Quick Actions")
                }

                Section {
                    ForEach(vacancies) { vac in
                        NavigationLink(destination: VacancyDetailView(vacancy: vac)) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(vac.title)
                                    .font(.headline)
                                Text("\(vac.company) • \(vac.location)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)

                                Text(vac.salary)
                                    .font(.caption)
                                    .bold()
                                    .foregroundColor(.green)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                } header: {
                    Text("Recommended Vacancies")
                }
            }
            .navigationTitle("WorkHub")
        }
    }
}

#Preview {
    HomeView()
}
