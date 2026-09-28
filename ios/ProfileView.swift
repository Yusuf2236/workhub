import SwiftUI

struct ProfileView: View {
    @State private var skills = ["Go", "Swift", "SwiftUI", "PostgreSQL", "Docker", "REST API"]
    @State private var newSkill = ""
    @State private var selectedLanguage = "O‘zbekcha (UZ)"
    @State private var darkMode = false
    @State private var notifications = true
    var onLogout: () -> Void = {}

    var body: some View {
        NavigationStack {
            List {
                // User card
                Section {
                    HStack(spacing: 14) {
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .frame(width: 50, height: 50)
                            .foregroundColor(.blue)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Farrux Zokirov")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text("farrux@wzone.uz")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("Senior Mobile & Backend Engineer")
                                .font(.caption2)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // 1-O'RIN: REZYUMELAR VA KO'NIKMALAR (SKILLS)
                Section {
                    HStack {
                        Text("ATS Moslik indeksi:")
                            .font(.caption)
                            .fontWeight(.semibold)
                        Spacer()
                        Text("88% Mos")
                            .font(.caption)
                            .fontWeight(.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.15))
                            .foregroundColor(.green)
                            .cornerRadius(6)
                    }

                    // Skills Tags
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Mening Ko‘nikmalarim:")
                            .font(.caption)
                            .fontWeight(.bold)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(skills, id: \.self) { skill in
                                    Text("\(skill) ✕")
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.1))
                                        .foregroundColor(.blue)
                                        .cornerRadius(8)
                                }
                            }
                        }

                        HStack {
                            TextField("Yangi ko‘nikma...", text: $newSkill)
                                .font(.caption)
                            Button("+ Qo‘shish") {
                                if !newSkill.trimmingCharacters(in: .whitespaces).isEmpty {
                                    skills.append(newSkill.trimmingCharacters(in: .whitespaces))
                                    newSkill = ""
                                }
                            }
                            .font(.caption)
                            .fontWeight(.bold)
                        }
                    }
                } header: {
                    Text("1. Rezyumelar & Skillar")
                        .foregroundColor(.blue)
                        .fontWeight(.black)
                }

                // 2-O'RIN: SAYT VA PROFIL SOZLAMALARI
                Section {
                    Picker("Ilova tili", selection: $selectedLanguage) {
                        Text("O‘zbekcha (UZ)").tag("O‘zbekcha (UZ)")
                        Text("Русский (RU)").tag("Русский (RU)")
                        Text("English (EN)").tag("English (EN)")
                    }

                    Toggle("Tungi rejim (Dark Mode)", isOn: $darkMode)
                    Toggle("Bildirishnomalar", isOn: $notifications)

                    Button(role: .destructive) {
                        onLogout()
                    } label: {
                        HStack {
                            Spacer()
                            Text("Tizimdan chiqish")
                                .fontWeight(.bold)
                            Spacer()
                        }
                    }
                } header: {
                    Text("2. Ilova va Tizim Sozlamalari")
                        .foregroundColor(.blue)
                        .fontWeight(.black)
                }
            }
            .navigationTitle("Profil & Sozlamalar")
        }
    }
}
