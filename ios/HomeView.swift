import SwiftUI

struct HomeView: View {
    @State private var newsList: [NewsArticle] = [
        NewsArticle(
            id: "1",
            title: "O'zbekistonda 2026-yilda eng yuqori maosh to'lanadigan IT va Fintech yo'nalishlari",
            excerpt: "Go backend, AI integratsiyalari va kiberxavfsizlik mutaxassislariga bo'lgan talab 45% ga oshdi. O'rtacha oylik maoshlar $1,500 dan $4,000 gacha.",
            content: "O'zbekiston raqamli iqtisodiyoti tez sur'atlar bilan rivojlanmoqda. Fintech, bank tizimlari va xalqaro autsorsing bozorida yuqori malakali mutaxassislarga bo'lgan ehtiyoj rekord darajaga yetdi.",
            category: "Bozor tahlili",
            imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
            author: "Sanjar Rahimov",
            date: "28-sentyabr, 2026",
            readTime: "4 daqiqa",
            views: 1420,
            likes: 89
        ),
        NewsArticle(
            id: "2",
            title: "Toshkentda 'Tech Careers Summit 2026' yirik xalqaro ish yarmarkasi start oldi",
            excerpt: "50 dan ortiq yirik texnologik kompaniyalar 1,000 dan ziyod ochiq bo'sh ish o'rinlarini taqdim etmoqda.",
            content: "Poytaxtimizda yilning eng yirik karyera forumi o'z ishini boshladi. Forumda Uzum, EPAM, Payme, Click va boshqa yetakchi kompaniyalar qatnashmoqda.",
            category: "Tadbirlar",
            imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
            author: "Aziza Yo‘ldosheva",
            date: "27-sentyabr, 2026",
            readTime: "3 daqiqa",
            views: 2150,
            likes: 142
        )
    ]

    @State private var comments: [CommunityCommentItem] = [
        CommunityCommentItem(id: "c1", authorName: "Farrux Zokirov", authorRole: "Senior Go Developer", content: "Backend yo'nalishida Microservices va Kafka biladigan dasturchilarga talab 40% oshibdi. Kompaniyalar juniorlarni ham o'qitishga tayyormi?", timestamp: "15 daqiqa oldin", likes: 24, likedByMe: false, topicTag: "#backend"),
        CommunityCommentItem(id: "c2", authorName: "Nilufar Qosimova", authorRole: "HR Director, Fintech", content: "Bizning kompaniyada hozirda 12 ta ochiq vakansiya bor. Eng muhimi — soft skills va o'rganishga bo'lgan ishtiyoq.", timestamp: "42 daqiqa oldin", likes: 38, likedByMe: false, topicTag: "#hr_maslahat")
    ]

    @State private var commentInput = ""
    @State private var selectedArticle: NewsArticle?

    let salaryTrends = [
        SalaryTrendItem(role: "Backend (Go, Java, Python)", range: "$900 - $3,800", growth: "+28%"),
        SalaryTrendItem(role: "Frontend (React, Next.js)", range: "$700 - $2,900", growth: "+22%"),
        SalaryTrendItem(role: "Mobile (Swift, Flutter)", range: "$800 - $3,200", growth: "+25%"),
        SalaryTrendItem(role: "DevOps & Cloud Security", range: "$1,200 - $4,200", growth: "+35%")
    ]

    let hotVacancies = [
        Vacancy(id: "1", title: "Senior Go Backend Architect", company: "Uzum Technologies", location: "Tashkent", description: "High-concurrency microservices, gRPC, PostgreSQL.", salary: "$3000 - $5500"),
        Vacancy(id: "2", title: "Senior iOS Engineer (SwiftUI)", company: "Payme", location: "Tashkent", description: "Fintech mobile applications, biometric auth, offline mode.", salary: "$2500 - $4500"),
        Vacancy(id: "3", title: "Lead DevOps Specialist", company: "EPAM Systems", location: "Remote", description: "Kubernetes, Terraform, CI/CD pipeline automation.", salary: "$3500 - $6000")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // 1. Hero Spotlight Card
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("✨ WZONE 2026")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(8)
                            Spacer()
                            Text("OneID Tasdiqlangan")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white.opacity(0.8))
                        }

                        Text("Karyerangizni yangi bosqichga olib chiqing")
                            .font(.title3)
                            .fontWeight(.black)
                            .foregroundColor(.white)

                        Text("O‘zbekiston mehnat bozorining eng so‘nggi vakansiyalari, tahliliy yangiliklar va jonli suhbat.")
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.9))

                        HStack(spacing: 12) {
                            Label("5,400+ Vakansiyalar", systemImage: "briefcase.fill")
                            Label("1,200+ Korxonalar", systemImage: "building.2.fill")
                        }
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.85))
                        .padding(.top, 4)
                    }
                    .padding(18)
                    .background(
                        LinearGradient(colors: [Color.blue, Color.indigo, Color.black.opacity(0.85)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .cornerRadius(20)
                    .padding(.horizontal)

                    // 2. Yangiliklar & Karyera Tahlillari
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Yangiliklar & Tahlillar")
                                .font(.headline)
                                .fontWeight(.bold)
                            Spacer()
                            Text("REAL-TIME")
                                .font(.caption2)
                                .fontWeight(.black)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(6)
                        }
                        .padding(.horizontal)

                        ForEach(newsList) { item in
                            Button {
                                selectedArticle = item
                            } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(item.category.uppercased())
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .foregroundColor(.blue)
                                        Spacer()
                                        Text(item.date)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }

                                    Text(item.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.primary)
                                        .multilineTextAlignment(.leading)

                                    Text(item.excerpt)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .lineLimit(2)
                                        .multilineTextAlignment(.leading)

                                    HStack {
                                        Text("Muallif: \(item.author)")
                                            .font(.caption2)
                                            .foregroundColor(.blue)
                                        Spacer()
                                        Text("Batafsil o‘qish →")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .foregroundColor(.blue)
                                    }
                                }
                                .padding(14)
                                .background(Color(UIColor.secondarySystemGroupedBackground))
                                .cornerRadius(16)
                                .padding(.horizontal)
                            }
                        }
                    }

                    // 3. Jonli Kommentariyalar & Muhokamalar
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Jonli Muhokamalar & Izohlar")
                            .font(.headline)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        // Add comment box
                        VStack(spacing: 8) {
                            HStack {
                                TextField("Fikringiz yoki savolingizni yozing...", text: $commentInput)
                                    .font(.footnote)
                                Button("Yuborish") {
                                    if !commentInput.trimmingCharacters(in: .whitespaces).isEmpty {
                                        comments.insert(
                                            CommunityCommentItem(
                                                id: UUID().uuidString,
                                                authorName: "Mehmon",
                                                authorRole: "Nomzod",
                                                content: commentInput,
                                                timestamp: "Hozirgina",
                                                likes: 1,
                                                likedByMe: true,
                                                topicTag: "#fikr"
                                            ),
                                            at: 0
                                        )
                                        commentInput = ""
                                    }
                                }
                                .font(.footnote)
                                .fontWeight(.bold)
                                .disabled(commentInput.trimmingCharacters(in: .whitespaces).isEmpty)
                            }
                        }
                        .padding(12)
                        .background(Color(UIColor.secondarySystemGroupedBackground))
                        .cornerRadius(14)
                        .padding(.horizontal)

                        ForEach($comments) { $cmt in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(cmt.authorName)
                                            .font(.caption)
                                            .fontWeight(.bold)
                                        Text(cmt.authorRole)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    Text(cmt.topicTag)
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.blue)
                                }

                                Text(cmt.content)
                                    .font(.footnote)
                                    .foregroundColor(.primary)

                                HStack {
                                    Text(cmt.timestamp)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Button {
                                        cmt.likedByMe.toggle()
                                        cmt.likes += cmt.likedByMe ? 1 : -1
                                    } label: {
                                        Text(cmt.likedByMe ? "❤️ \(cmt.likes)" : "🤍 \(cmt.likes)")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                    }
                                }
                            }
                            .padding(12)
                            .background(Color(UIColor.secondarySystemGroupedBackground))
                            .cornerRadius(14)
                            .padding(.horizontal)
                        }
                    }

                    // 4. Haftaning Sara Vakansiyalari
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Haftaning Sara Vakansiyalari")
                            .font(.headline)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        ForEach(hotVacancies) { vac in
                            NavigationLink(destination: VacancyDetailView(vacancy: vac)) {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(vac.company)
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.blue)
                                        Spacer()
                                        Text(vac.location)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }

                                    Text(vac.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.primary)

                                    Text(vac.salary)
                                        .font(.caption)
                                        .fontWeight(.black)
                                        .foregroundColor(.green)
                                }
                                .padding(14)
                                .background(Color(UIColor.secondarySystemGroupedBackground))
                                .cornerRadius(16)
                                .padding(.horizontal)
                            }
                        }
                    }

                    // 5. 2026-yil Maoshlar Indeksi
                    VStack(alignment: .leading, spacing: 10) {
                        Text("📈 2026-yil O‘rtacha Maoshlar Indeksi")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        ForEach(salaryTrends) { trend in
                            HStack {
                                Text(trend.role)
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.85))
                                Spacer()
                                Text(trend.range)
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.cyan)
                                Text(trend.growth)
                                    .font(.caption2)
                                    .fontWeight(.black)
                                    .foregroundColor(.green)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.black.opacity(0.85))
                    .cornerRadius(20)
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
            .navigationTitle("WZone")
            .sheet(item: $selectedArticle) { art in
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(art.category.uppercased())
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)

                            Text(art.title)
                                .font(.title3)
                                .fontWeight(.black)

                            Text("Muallif: \(art.author) • \(art.date)")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Divider()

                            Text(art.content)
                                .font(.body)
                                .lineSpacing(6)
                        }
                        .padding()
                    }
                    .navigationTitle("Yangilik")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Yopish") {
                                selectedArticle = nil
                            }
                        }
                    }
                }
            }
        }
    }
}
