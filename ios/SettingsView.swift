import SwiftUI

struct SettingsView: View {
    @StateObject private var state = AppState()
    @State private var showReview = false
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Settings")
                            .font(.system(size: 34 * state.pendingTextScale, weight: .bold))
                        Text("Make the app feel like yours.")
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 28)
                        
                        // Dark mode
                        Card(radius: state.pendingRadius) {
                            HStack {
                                ZStack {
                                    Circle()
                                        .fill(state.pendingAccent.opacity(0.15))
                                        .frame(width: 38, height: 38)
                                    Image(systemName: state.pendingDark ? "moon.fill" : "sun.max.fill")
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundStyle(state.pendingAccent)
                                        .rotationEffect(.degrees(state.pendingDark ? 0 : 360))
                                        .scaleEffect(state.pendingDark ? 1.0 : 1.15)
                                        .animation(.spring(response: 0.45, dampingFraction: 0.65), value: state.pendingDark)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Dark mode")
                                        .font(.body.weight(.semibold))
                                    Text("Tap to switch the mood")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Toggle("", isOn: Binding(
                                    get: { state.pendingDark },
                                    set: { val in
                                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                            state.pendingDark = val
                                        }
                                    }
                                ))
                                .tint(state.pendingAccent)
                                .labelsHidden()
                            }
                            .padding()
                        }
                        
                        SectionHeader("PERSONALIZATION")
                        Card(radius: state.pendingRadius) {
                            NavigationLink {
                                AppearanceView()
                            } label: {
                                SettingsRow(icon: "paintpalette", title: "Appearance",
                                            subtitle: state.appearanceSummary, accent: state.pendingAccent)
                            }
                            Divider().padding(.leading, 50)
                            NavigationLink {
                                LanguageView()
                            } label: {
                                SettingsRow(icon: "globe", title: "Language",
                                            subtitle: languageName(state.pendingLang), accent: state.pendingAccent)
                            }
                        }
                        
                        SectionHeader("ALERTS")
                        Card(radius: state.pendingRadius) {
                            NavigationLink {
                                NotificationsView()
                            } label: {
                                SettingsRow(icon: "bell", title: "Notifications",
                                            subtitle: "Messages and promos", accent: state.pendingAccent)
                            }
                        }
                        
                        SectionHeader("PRIVACY & SECURITY")
                        Card(radius: state.pendingRadius) {
                            SettingsRow(icon: "lock", title: "Privacy",
                                        subtitle: "Visible to everyone", accent: state.pendingAccent)
                            Divider().padding(.leading, 50)
                            SettingsRow(icon: "shield", title: "Security",
                                        subtitle: "Basic protection", accent: state.pendingAccent)
                        }
                    }
                    .padding(20)
                    .padding(.bottom, state.hasChanges ? 80 : 20)
                }
                
                if state.hasChanges {
                    HStack {
                        Text("• \(state.changesCount) \(state.changesCount == 1 ? "change" : "changes")")
                            .foregroundStyle(state.pendingAccent)
                            .fontWeight(.medium)
                        Spacer()
                        Button("Discard") { state.discard() }
                        Button("Review") { showReview = true }
                            .buttonStyle(.borderedProminent)
                            .tint(state.pendingAccent)
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.headline)
                    }
                }
            }
        }
        .preferredColorScheme(state.pendingDark ? .dark : .light)
        .animation(.easeInOut(duration: 0.45), value: state.pendingDark)
        .tint(state.pendingAccent)
        .environmentObject(state)
        .sheet(isPresented: $showReview) {
            ReviewSheet()
        }
    }
}

// MARK: - Appearance
struct AppearanceView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss
    
    let colors: [Color] = [
        Color(hex: "7C5CFF"), Color(hex: "FF4D8D"), Color(hex: "3B82F6"),
        Color(hex: "22C55E"), Color(hex: "F59E0B")
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {
                // Preview
                HStack {
                    Image(systemName: "sparkles").foregroundStyle(state.pendingAccent)
                    VStack(alignment: .leading) {
                        Text("Weekly summary").fontWeight(.semibold)
                        Text("Your plan for the week is ready.").font(.subheadline).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Open") {}
                        .buttonStyle(.borderedProminent)
                        .tint(state.pendingAccent)
                        .clipShape(RoundedRectangle(cornerRadius: state.pendingRadius * 0.7))
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: state.pendingRadius))
                
                // Theme color
                Text("THEME COLOR").sectionStyle()
                HStack(spacing: 14) {
                    ForEach(colors, id: \.self) { c in
                        let isSelected = state.pendingAccent.toHex() == c.toHex()
                        Circle()
                            .fill(c)
                            .frame(width: 44, height: 44)
                            .overlay(
                                Circle()
                                    .stroke(isSelected ? Color.primary : Color.clear, lineWidth: 3)
                                    .padding(-3)
                            )
                            .onTapGesture { state.pendingAccent = c }
                    }
                }
                
                // Text size
                Text("TEXT SIZE").sectionStyle()
                HStack {
                    ForEach([0.85, 1.0, 1.15, 1.3], id: \.self) { scale in
                        let isSelected = state.pendingTextScale == scale
                        Text("Aa")
                            .font(.system(size: 18 * scale, weight: isSelected ? .bold : .medium))
                            .frame(width: 70, height: 48)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(isSelected ? state.pendingAccent.opacity(0.15) : Color(.secondarySystemBackground))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(state.pendingAccent, lineWidth: isSelected ? 2 : 0)
                            )
                            .onTapGesture { state.pendingTextScale = scale }
                    }
                }
                
                // UI Style
                Text("UI STYLE").sectionStyle()
                HStack {
                    ForEach([(22.0, "Rounded"), (14.0, "Soft"), (6.0, "Crisp")], id: \.0) { item in
                        let isSelected = state.pendingRadius == item.0
                        VStack {
                            RoundedRectangle(cornerRadius: item.0)
                                .fill(isSelected ? state.pendingAccent : state.pendingAccent.opacity(0.3))
                                .frame(width: 90, height: 40)
                                .overlay(
                                    RoundedRectangle(cornerRadius: item.0)
                                        .stroke(isSelected ? Color.primary : Color.clear, lineWidth: 2)
                                )
                                .onTapGesture { state.pendingRadius = item.0 }
                            Text(item.1)
                                .font(.subheadline)
                                .foregroundStyle(isSelected ? state.pendingAccent : .primary)
                        }
                    }
                }
            }
            .padding(20)
        }
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Language
struct LanguageView: View {
    @EnvironmentObject var state: AppState
    
    let languages = [
        ("en", "English"), ("uz", "O‘zbekcha"), ("ru", "Русский"),
        ("fr", "Français"), ("es", "Español"), ("de", "Deutsch"),
        ("pt", "Português"), ("it", "Italiano")
    ]
    
    var body: some View {
        List {
            ForEach(languages, id: \.0) { code, name in
                Button {
                    state.pendingLang = code
                } label: {
                    HStack {
                        Text(code.uppercased())
                            .font(.caption.bold())
                            .frame(width: 36, height: 36)
                            .background(state.pendingLang == code ? state.pendingAccent : Color(.secondarySystemBackground))
                            .foregroundStyle(state.pendingLang == code ? .white : .primary)
                            .clipShape(Circle())
                        VStack(alignment: .leading) {
                            Text(name)
                            Text(code.uppercased()).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if state.pendingLang == code {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(state.pendingAccent)
                        }
                    }
                }
                .foregroundStyle(.primary)
            }
        }
        .navigationTitle("Language")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Notifications
struct NotificationsView: View {
    @EnvironmentObject var state: AppState
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Card(radius: state.pendingRadius) {
                    ToggleRow(icon: "bell.badge", title: "Push notifications",
                              subtitle: "On this device", isOn: $state.pendingPush, accent: state.pendingAccent)
                }
                
                VStack(alignment: .leading) {
                    Text("NOTIFY ME ABOUT").sectionStyle()
                    Card(radius: state.pendingRadius) {
                        ToggleRow(icon: "bubble.left", title: "Messages",
                                  subtitle: "Replies and new chats", isOn: $state.pendingMessages, accent: state.pendingAccent)
                        Divider().padding(.leading, 50)
                        ToggleRow(icon: "tag", title: "Promotions",
                                  subtitle: "Offers and news", isOn: $state.pendingPromos, accent: state.pendingAccent)
                    }
                }
                
                VStack(alignment: .leading) {
                    Text("SOUND & VIBRATION").sectionStyle()
                    Card(radius: state.pendingRadius) {
                        ToggleRow(icon: "speaker.wave.2", title: "Sound",
                                  subtitle: "A soft tone for alerts", isOn: $state.pendingSound, accent: state.pendingAccent)
                        Divider().padding(.leading, 50)
                        ToggleRow(icon: "iphone.radiowaves.left.and.right", title: "Vibration",
                                  subtitle: "A gentle buzz", isOn: $state.pendingVibration, accent: state.pendingAccent)
                    }
                }
            }
            .padding(20)
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Review Sheet
struct ReviewSheet: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Capsule()
                .fill(.secondary)
                .frame(width: 40, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 12)
            
            Text("Review changes")
                .font(.title2.bold())
                .padding(.top, 20)
            Text("\(state.changesCount) changes ready to apply")
                .foregroundStyle(.secondary)
                .padding(.bottom, 20)
            
            ScrollView {
                VStack(spacing: 8) {
                    if state.dark != state.pendingDark {
                        ChangeRow(label: "Dark mode", from: state.dark ? "On" : "Off",
                                  to: state.pendingDark ? "On" : "Off", accent: state.pendingAccent)
                    }
                    if state.accent.toHex() != state.pendingAccent.toHex() {
                        ChangeRow(label: "Theme color", from: colorName(state.accent),
                                  to: colorName(state.pendingAccent), accent: state.pendingAccent)
                    }
                    if state.textScale != state.pendingTextScale {
                        ChangeRow(label: "Text size", from: textScaleName(state.textScale),
                                  to: textScaleName(state.pendingTextScale), accent: state.pendingAccent)
                    }
                    if state.radius != state.pendingRadius {
                        ChangeRow(label: "UI style", from: radiusStyleName(state.radius),
                                  to: radiusStyleName(state.pendingRadius), accent: state.pendingAccent)
                    }
                    if state.lang != state.pendingLang {
                        ChangeRow(label: "Language", from: languageName(state.lang),
                                  to: languageName(state.pendingLang), accent: state.pendingAccent)
                    }
                    if state.push != state.pendingPush {
                        ChangeRow(label: "Push", from: state.push ? "On" : "Off",
                                  to: state.pendingPush ? "On" : "Off", accent: state.pendingAccent)
                    }
                    if state.messages != state.pendingMessages {
                        ChangeRow(label: "Messages", from: state.messages ? "On" : "Off",
                                  to: state.pendingMessages ? "On" : "Off", accent: state.pendingAccent)
                    }
                    if state.promos != state.pendingPromos {
                        ChangeRow(label: "Promotions", from: state.promos ? "On" : "Off",
                                  to: state.pendingPromos ? "On" : "Off", accent: state.pendingAccent)
                    }
                    if state.sound != state.pendingSound {
                        ChangeRow(label: "Sound", from: state.sound ? "On" : "Off",
                                  to: state.pendingSound ? "On" : "Off", accent: state.pendingAccent)
                    }
                    if state.vibration != state.pendingVibration {
                        ChangeRow(label: "Vibration", from: state.vibration ? "On" : "Off",
                                  to: state.pendingVibration ? "On" : "Off", accent: state.pendingAccent)
                    }
                }
            }
            
            Button {
                state.save()
                dismiss()
            } label: {
                Text("Save changes")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(state.pendingAccent)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .padding(.top, 16)
        }
        .padding(20)
        .presentationDetents([.medium, .large])
    }
}

// MARK: - Helpers
struct Card<Content: View>: View {
    let radius: CGFloat
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(spacing: 0) { content }
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: radius))
    }
}

struct SettingsRow: View {
    let icon: String, title: String, subtitle: String
    let accent: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon).foregroundStyle(accent).frame(width: 28)
            VStack(alignment: .leading) {
                Text(title)
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.tertiary)
        }
        .padding()
    }
}

struct ToggleRow: View {
    let icon: String, title: String, subtitle: String
    @Binding var isOn: Bool
    let accent: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon).foregroundStyle(accent).frame(width: 28)
            VStack(alignment: .leading) {
                Text(title)
                Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            Toggle("", isOn: $isOn).tint(accent).labelsHidden()
        }
        .padding()
    }
}

struct ChangeRow: View {
    let label: String, from: String, to: String
    let accent: Color
    
    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(from).foregroundStyle(.secondary)
            Image(systemName: "arrow.right").font(.caption).foregroundStyle(accent)
            Text(to).foregroundStyle(accent).fontWeight(.semibold)
        }
        .padding(.vertical, 6)
    }
}

struct SectionHeader: View {
    let text: String
    init(_ text: String) { self.text = text }
    
    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.top, 24)
            .padding(.bottom, 8)
    }
}

extension Text {
    func sectionStyle() -> some View {
        self
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .tracking(0.5)
    }
}
