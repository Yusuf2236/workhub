import SwiftUI

struct VacancyDetailView: View {
    let vacancy: Vacancy
    @State private var isApplied = false
    @State private var showConfirmDialog = false

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
                    Text(vacancy.salary)
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
                }

                Spacer()

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
                        Text("Ariza topshirish")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Vakansiya")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Arizani tasdiqlang", isPresented: $showConfirmDialog) {
            Button("Tasdiqlash va topshirish") {
                isApplied = true
            }
            Button("Bekor qilish", role: .cancel) {}
        } message: {
            Text("\(vacancy.title) lavozimiga o‘z rezyumengiz bilan ariza topshirmoqchimisiz?")
        }
    }
}
