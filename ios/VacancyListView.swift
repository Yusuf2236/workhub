import SwiftUI

struct VacancyListView: View {
    @State private var searchQuery = ""
    @State private var selectedCategory = "Barchasi"
    @State private var selectedRegion = "Barcha hududlar"
    @State private var vacancies: [Vacancy] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    let categories = [
        "Barchasi",
        "IT & Dasturlash",
        "Marketing & Savdo",
        "Dizayn & UX",
        "Moliya & Buxgalteriya",
        "HR & Menejment",
        "Ta’lim & Fan"
    ]

    let regions = [
        "Barcha hududlar",
        "Toshkent shahri",
        "Toshkent viloyati",
        "Samarqand viloyati",
        "Farg‘ona viloyati",
        "Andijon viloyati",
        "Namangan viloyati",
        "Buxoro viloyati",
        "Xorazm viloyati",
        "Qoraqalpog‘iston",
        "Masofaviy (Remote)"
    ]

    var filteredVacancies: [Vacancy] {
        vacancies.filter { vac in
            let matchesSearch = searchQuery.isEmpty || vac.title.localizedCaseInsensitiveContains(searchQuery) || vac.company.localizedCaseInsensitiveContains(searchQuery)
            let matchesCategory = selectedCategory == "Barchasi" || (vac.category ?? "").localizedCaseInsensitiveContains(selectedCategory)
            let matchesRegion = selectedRegion == "Barcha hududlar" || vac.location.localizedCaseInsensitiveContains(selectedRegion)
            return matchesSearch && matchesCategory && matchesRegion
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Kasb, lavozim yoki kompaniya...", text: $searchQuery)
                        .font(.subheadline)
                        .onSubmit {
                            loadVacancies()
                        }
                }
                .padding(10)
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
                .padding(.horizontal)
                .padding(.top, 8)

                // Region selector
                HStack {
                    Menu {
                        ForEach(regions, id: \.self) { reg in
                            Button(reg) {
                                selectedRegion = reg
                                loadVacancies()
                            }
                        }
                    } label: {
                        HStack {
                            Text("📍 Hudud: \(selectedRegion)")
                                .font(.caption)
                                .fontWeight(.semibold)
                            Image(systemName: "chevron.down")
                                .font(.caption2)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                    }

                    Spacer()

                    Text("\(filteredVacancies.count) ta vakansiya")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                .padding(.top, 8)

                // Category scroll
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.self) { cat in
                            Button(action: {
                                selectedCategory = cat
                                loadVacancies()
                            }) {
                                Text(cat)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(selectedCategory == cat ? Color.blue : Color(UIColor.secondarySystemBackground))
                                    .foregroundColor(selectedCategory == cat ? .white : .primary)
                                    .cornerRadius(16)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Vacancy list
                if isLoading && vacancies.isEmpty {
                    Spacer()
                    ProgressView("Vakansiyalar yuklanmoqda...")
                    Spacer()
                } else if filteredVacancies.isEmpty {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "tray")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text("Vakansiyalar topilmadi")
                            .font(.headline)
                        Text("Qidiruv parametrlarini o'zgartirib ko'ring")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                } else {
                    List(filteredVacancies) { vacancy in
                        NavigationLink(destination: VacancyDetailView(vacancy: vacancy)) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(vacancy.title)
                                    .font(.headline)
                                    .foregroundColor(.primary)

                                Text(vacancy.company)
                                    .font(.subheadline)
                                    .foregroundColor(.blue)

                                HStack {
                                    Text(vacancy.location)
                                    Spacer()
                                    Text(vacancy.salaryFormatted)
                                        .fontWeight(.bold)
                                        .foregroundColor(.green)
                                }
                                .font(.caption)
                                .foregroundColor(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await loadVacanciesAsync()
                    }
                }
            }
            .navigationTitle("Vakansiyalar")
            .onAppear {
                if vacancies.isEmpty {
                    loadVacancies()
                }
            }
        }
    }

    private func loadVacancies() {
        Task {
            await loadVacanciesAsync()
        }
    }

    private func loadVacanciesAsync() async {
        isLoading = true
        do {
            let items = try await APIClient.shared.fetchVacancies(
                search: searchQuery,
                category: selectedCategory,
                location: selectedRegion
            )
            await MainActor.run {
                self.vacancies = items
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                // Fallback mock items agar server offline bo'lsa
                if self.vacancies.isEmpty {
                    self.vacancies = [
                        Vacancy(id: "1", title: "Senior Go Backend Architect", company: "WorkHub Global", location: "Tashkent / Remote", description: "Designing high-concurrency microservices, PostgreSQL, and Redis caching systems.", salaryMin: 4000, salaryMax: 6000, salaryCurrency: "USD", category: "IT & Dasturlash"),
                        Vacancy(id: "2", title: "Mobile iOS Lead (SwiftUI)", company: "Mobile Studio", location: "Tashkent shahri", description: "Native SwiftUI architecture and WebSocket integrations.", salaryMin: 3500, salaryMax: 5000, salaryCurrency: "USD", category: "IT & Dasturlash"),
                        Vacancy(id: "3", title: "Cloud & DevOps Engineer", company: "InfraCorp", location: "Tashkent shahri", description: "Managing Kubernetes clusters, MinIO storage, and Docker pipelines.", salaryMin: 3000, salaryMax: 4500, salaryCurrency: "USD", category: "IT & Dasturlash")
                    ]
                }
                self.isLoading = false
            }
        }
    }
}
