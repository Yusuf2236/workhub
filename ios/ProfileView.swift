import SwiftUI

struct ProfileView: View {
    @ObservedObject var session = SessionManager.shared
    @State private var resumes: [Resume] = []
    @State private var skills: [String] = ["Go", "Swift", "SwiftUI", "PostgreSQL", "Docker", "REST API"]
    @State private var newSkill = ""
    @State private var selectedLanguage = "O‘zbekcha (UZ)"
    @State private var darkMode = false
    @State private var notifications = true

    @State private var showEditProfile = false
    @State private var showAddResume = false
    @State private var showDeleteAccountAlert = false

    @State private var editName = ""
    @State private var editPhone = ""
    @State private var editProfession = ""
    @State private var editLocation = ""
    @State private var editBio = ""

    @State private var resumeTitle = ""
    @State private var resumeSkills = ""
    @State private var resumeExperience = "2"
    @State private var resumeSummary = ""

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
                            Text(session.currentUser?.name ?? "Foydalanuvchi")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text(session.currentUser?.email ?? "foydalanuvchi@wzone.uz")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(session.currentUser?.profession ?? "Mutaxassis")
                                .font(.caption2)
                                .foregroundColor(.blue)
                        }

                        Spacer()

                        Button(action: {
                            editName = session.currentUser?.name ?? ""
                            editPhone = session.currentUser?.phone ?? ""
                            editProfession = session.currentUser?.profession ?? ""
                            editLocation = session.currentUser?.location ?? ""
                            editBio = session.currentUser?.bio ?? ""
                            showEditProfile = true
                        }) {
                            Image(systemName: "pencil.circle")
                                .font(.title3)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // REZYUMELAR BO'LIMI
                Section {
                    HStack {
                        Text("Rezyumelar soni: \(resumes.count)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Button("+ Yangi Rezyume") {
                            showAddResume = true
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    }

                    if resumes.isEmpty {
                        Text("Hozircha rezyume qo‘shilmagan. Ariza topshirish uchun yangi rezyume yarating.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(resumes) { res in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(res.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                    Text("\(res.profession ?? "Dasturchi") • \(res.experienceYears ?? 0) yil tajriba")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Button(role: .destructive) {
                                    deleteResume(id: res.id)
                                } label: {
                                    Image(systemName: "trash")
                                        .font(.caption)
                                }
                            }
                        }
                    }
                } header: {
                    Text("1. Mening Rezyumelarim")
                        .foregroundColor(.blue)
                        .fontWeight(.black)
                }

                // KO'NIKMALAR (SKILLS)
                Section {
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
                                        .onTapGesture {
                                            skills.removeAll { $0 == skill }
                                        }
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
                                    saveSkills()
                                }
                            }
                            .font(.caption)
                            .fontWeight(.bold)
                        }
                    }
                } header: {
                    Text("2. Ko‘nikmalar (Skills)")
                        .foregroundColor(.blue)
                        .fontWeight(.black)
                }

                // SOZLAMALAR VA XAVFSIZLIK
                Section {
                    Picker("Ilova tili", selection: $selectedLanguage) {
                        Text("O‘zbekcha (UZ)").tag("O‘zbekcha (UZ)")
                        Text("Русский (RU)").tag("Русский (RU)")
                        Text("English (EN)").tag("English (EN)")
                    }

                    Toggle("Tungi rejim (Dark Mode)", isOn: $darkMode)
                    Toggle("Bildirishnomalar", isOn: $notifications)

                    // APPLE REVIEW GUIDELINE 5.1.1(v) TALABI: Akkauntni o'chirish
                    Button(role: .destructive) {
                        showDeleteAccountAlert = true
                    } label: {
                        HStack {
                            Text("Akkauntni Butunlay O‘chirish")
                                .font(.subheadline)
                                .foregroundColor(.red)
                            Spacer()
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.red)
                        }
                    }

                    Button(role: .cancel) {
                        session.clearSession()
                        onLogout()
                    } label: {
                        HStack {
                            Spacer()
                            Text("Tizimdan chiqish")
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                            Spacer()
                        }
                    }
                } header: {
                    Text("3. Ilova va Maxfiylik Sozlamalari")
                        .foregroundColor(.blue)
                        .fontWeight(.black)
                }
            }
            .navigationTitle("Profil & Sozlamalar")
            .onAppear {
                loadProfileAndResumes()
            }
            .sheet(isPresented: $showEditProfile) {
                NavigationStack {
                    Form {
                        TextField("Ism", text: $editName)
                        TextField("Telefon", text: $editPhone)
                        TextField("Kasb", text: $editProfession)
                        TextField("Manzil", text: $editLocation)
                        TextField("Bio", text: $editBio)
                    }
                    .navigationTitle("Profilni tahrirlash")
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Saqlash") {
                                saveProfile()
                                showEditProfile = false
                            }
                        }
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Bekor qilish") {
                                showEditProfile = false
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showAddResume) {
                NavigationStack {
                    Form {
                        TextField("Rezyume sarlavhasi", text: $resumeTitle)
                        TextField("Ko‘nikmalar", text: $resumeSkills)
                        TextField("Tajriba (yil)", text: $resumeExperience)
                        TextField("Qisqacha ta'rif", text: $resumeSummary)
                    }
                    .navigationTitle("Yangi Rezyume")
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Yaratish") {
                                createResume()
                                showAddResume = false
                            }
                        }
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Bekor qilish") {
                                showAddResume = false
                            }
                        }
                    }
                }
            }
            .alert("Akkauntni o‘chirish", isPresented: $showDeleteAccountAlert) {
                Button("O‘chirish", role: .destructive) {
                    session.clearSession()
                    onLogout()
                }
                Button("Bekor qilish", role: .cancel) {}
            } message: {
                Text("Haqiqatan ham akkauntingizni va barcha ma'lumotlaringizni butunlay o‘chirib tashlamoqchimisiz?")
            }
        }
    }

    private func loadProfileAndResumes() {
        Task {
            if let user = try? await APIClient.shared.fetchProfile() {
                await MainActor.run {
                    if let s = user.skills, !s.isEmpty {
                        self.skills = s.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) }
                    }
                }
            }
            if let items = try? await APIClient.shared.fetchResumes() {
                await MainActor.run {
                    self.resumes = items
                }
            }
        }
    }

    private func saveProfile() {
        Task {
            _ = try? await APIClient.shared.updateProfile(
                name: editName,
                phone: editPhone,
                profession: editProfession,
                location: editLocation,
                bio: editBio,
                skills: skills.joined(separator: ",")
            )
        }
    }

    private func saveSkills() {
        saveProfile()
    }

    private func createResume() {
        Task {
            let exp = Int(resumeExperience) ?? 1
            if let created = try? await APIClient.shared.createResume(
                title: resumeTitle.isEmpty ? "Mening Rezyumem" : resumeTitle,
                fullName: session.currentUser?.name ?? "Nomzod",
                phone: session.currentUser?.phone ?? "",
                email: session.currentUser?.email ?? "",
                profession: session.currentUser?.profession ?? "Dasturchi",
                skills: resumeSkills.isEmpty ? skills.joined(separator: ",") : resumeSkills,
                experienceYears: exp,
                summary: resumeSummary
            ) {
                await MainActor.run {
                    self.resumes.insert(created, at: 0)
                }
            }
        }
    }

    private func deleteResume(id: String) {
        Task {
            _ = try? await APIClient.shared.deleteResume(id: id)
            await MainActor.run {
                self.resumes.removeAll { $0.id == id }
            }
        }
    }
}
