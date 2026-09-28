import SwiftUI

struct VacancyDetailView: View {
    let vacancy: Vacancy
    @State private var isApplied = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(vacancy.title)
                        .font(.title2)
                        .bold()
                        .foregroundColor(.primary)

                    Text("\(vacancy.company) • \(vacancy.location)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text(vacancy.salary)
                        .font(.caption)
                        .bold()
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green.opacity(0.15))
                        .foregroundColor(.green)
                        .cornerRadius(8)
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Job Description")
                        .font(.headline)

                    Text(vacancy.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if isApplied {
                    HStack {
                        Spacer()
                        Text("✓ Application Submitted")
                            .font(.headline)
                            .foregroundColor(.green)
                        Spacer()
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                } else {
                    Button(action: {
                        isApplied = true
                    }) {
                        Text("Apply Now")
                            .font(.headline)
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
        .navigationTitle("Job Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}
