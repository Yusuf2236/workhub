import SwiftUI

struct VacancyListView: View {
    @State private var searchQuery = ""
    @State private var selectedCategory = "Barchasi"
    @State private var selectedRegion = "Barcha hududlar"

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

    let vacancies = [
        Vacancy(id: "1", title: "Senior Go Backend Architect", company: "WorkHub Global", location: "Tashkent / Remote", description: "Designing high-concurrency microservices, PostgreSQL, and Redis caching systems.", salary: "$4000 - $6000", category: "IT & Dasturlash"),
        Vacancy(id: "2", title: "Mobile iOS Lead (SwiftUI)", company: "Mobile Studio", location: "Tashkent shahri", description: "Native SwiftUI architecture and WebSocket integrations.", salary: "$3500 - $5000", category: "IT & Dasturlash"),
        Vacancy(id: "3", title: "Cloud & DevOps Engineer", company: "InfraCorp", location: "Tashkent shahri", description: "Managing Kubernetes clusters, MinIO storage, and Docker pipelines.", salary: "$3000 - $4500", category: "IT & Dasturlash"),
        Vacancy(id: "4", title: "Lead Product Designer (UI/UX)", company: "Fintech Hub", location: "Samarqand viloyati", description: "Mobile and web design systems, user journeys, Figma prototypes.", salary: "$2000 - $3500", category: "Dizayn & UX"),
        Vacancy(id: "5", title: "HR Business Partner", company: "Tech Talent", location: "Toshkent shahri", description: "Talent acquisition, culture development, ATS workflow management.", salary: "$1500 - $2800", category: "HR & Menejment")
    ]

    var filteredVacancies: [Vacancy] {
        vacancies.filter { vac in
            let matchesSearch = searchQuery.isEmpty || vac.title.localizedCaseInsensitiveContains(searchQuery) || vac.company.localizedCaseInsensitiveContains(searchQuery)
            let matchesCategory = selectedCategory == "Barchasi" || vac.category == selectedCategory
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
                            Button {
                                selectedCategory = cat
                            } label: {
                                Text(cat)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(selectedCategory == cat ? Color.blue : Color(UIColor.secondarySystemBackground))
                                    .foregroundColor(selectedCategory == cat ? .white : .primary)
                                    .cornerRadius(10)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Vacancy list
                List(filteredVacancies) { vac in
                    NavigationLink(destination: VacancyDetailView(vacancy: vac)) {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(vac.company)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Spacer()
                                Text(vac.location)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }

                            Text(vac.title)
                                .font(.headline)

                            Text(vac.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)

                            Text(vac.salary)
                                .font(.footnote)
                                .fontWeight(.black)
                                .foregroundColor(.green)
                        }
                        .padding(.vertical, 4)
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("Vakansiyalar")
        }
    }
}
