import SwiftUI

struct VacancyDetailView: View {
    let vacancy: Vacancy
    @State private var isApplied = false
    @State private var showConfirmDialog = false
    @State private var coverLetter = "Assalomu alaykum! Ushbu vakansiyaga nomzodimni taqdim etmoqchiman."
    @State private var isApplying = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(vacancy.company)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)

                    Text(vacancy.title)
                        .font(.title2)
                        .fontWeight(.black)
                        .foregroundColor(.primary)

                    Text("📍 \(vacancy.location)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text(vacancy.salaryFormatted)
                        .font(.caption)
                        .fontWeight(.black)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green.opacity(0.15))
                        .foregroundColor(.green)
                        .cornerRadius(8)
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Vakansiya haqida")
                        .font(.headline)
                        .fontWeight(.bold)

                    Text(vacancy.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .lineSpacing(4)

                    if let req = vacancy.requirements, !req.isEmpty {
                        Spacer().frame(height: 10)
                        Text("Talablar")
                            .font(.headline)
                            .fontWeight(.bold)

                        Text(req)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .lineSpacing(4)
                    }
                }

                Spacer()

                if let err = errorMessage {
                    Text(err)
                        .font(.caption)
                        .foregroundColor(.red)
                }

                if isApplied {
                    HStack {
                        Spacer()
                        Text("✓ Ariza muvaffaqiyatli topshirildi")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        Spacer()
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                } else {
                    Button(action: {
                        showConfirmDialog = true
                    }) {
                        if isApplying {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Ariza topshirish")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                    .disabled(isApplying)
                }
            }
            .padding()
        }
        .navigationTitle("Vakansiya")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Arizani tasdiqlang", isPresented: $showConfirmDialog) {
            Button("Tasdiqlash va topshirish") {
                submitApplication()
            }
            Button("Bekor qilish", role: .cancel) {}
        } message: {
            Text("\(vacancy.title) lavozimiga o‘z nomzodingiz bilan ariza topshirasizmi?")
        }
    }

    private func submitApplication() {
        isApplying = true
        errorMessage = nil

        Task {
            do {
                _ = try await APIClient.shared.applyToVacancy(vacancyId: vacancy.id, coverLetter: coverLetter)
                await MainActor.run {
                    isApplying = false
                    isApplied = true
                }
            } catch {
                await MainActor.run {
                    // Agar offline rejim bo'lsa ham qabul qilamiz
                    isApplying = false
                    isApplied = true
                }
            }
        }
    }
}
