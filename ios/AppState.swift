import SwiftUI
import Combine

class AppState: ObservableObject {
    @Published var dark = false
    @Published var accent = Color(hex: "7C5CFF")
    @Published var textScale: CGFloat = 1.0
    @Published var radius: CGFloat = 22
    @Published var lang = "en"
    
    @Published var push = true
    @Published var messages = true
    @Published var promos = false
    @Published var sound = true
    @Published var vibration = true
    
    // Pending
    @Published var pendingDark = false
    @Published var pendingAccent = Color(hex: "7C5CFF")
    @Published var pendingTextScale: CGFloat = 1.0
    @Published var pendingRadius: CGFloat = 22
    @Published var pendingLang = "en"
    @Published var pendingPush = true
    @Published var pendingMessages = true
    @Published var pendingPromos = false
    @Published var pendingSound = true
    @Published var pendingVibration = true
    
    var hasChanges: Bool {
        dark != pendingDark || accent.toHex() != pendingAccent.toHex() ||
        textScale != pendingTextScale || radius != pendingRadius ||
        lang != pendingLang || push != pendingPush ||
        messages != pendingMessages || promos != pendingPromos ||
        sound != pendingSound || vibration != pendingVibration
    }
    
    var changesCount: Int {
        var n = 0
        if dark != pendingDark { n += 1 }
        if accent.toHex() != pendingAccent.toHex() { n += 1 }
        if textScale != pendingTextScale { n += 1 }
        if radius != pendingRadius { n += 1 }
        if lang != pendingLang { n += 1 }
        if push != pendingPush { n += 1 }
        if messages != pendingMessages { n += 1 }
        if promos != pendingPromos { n += 1 }
        if sound != pendingSound { n += 1 }
        if vibration != pendingVibration { n += 1 }
        return n
    }
    
    func discard() {
        pendingDark = dark
        pendingAccent = accent
        pendingTextScale = textScale
        pendingRadius = radius
        pendingLang = lang
        pendingPush = push
        pendingMessages = messages
        pendingPromos = promos
        pendingSound = sound
        pendingVibration = vibration
    }
    
    func save() {
        dark = pendingDark
        accent = pendingAccent
        textScale = pendingTextScale
        radius = pendingRadius
        lang = pendingLang
        push = pendingPush
        messages = pendingMessages
        promos = pendingPromos
        sound = pendingSound
        vibration = pendingVibration
        
        let ud = UserDefaults.standard
        ud.set(dark, forKey: "dark")
        ud.set(accent.toHex(), forKey: "accent")
        ud.set(Double(textScale), forKey: "textScale")
        ud.set(Double(radius), forKey: "radius")
        ud.set(lang, forKey: "lang")
        ud.set(push, forKey: "push")
        ud.set(messages, forKey: "messages")
        ud.set(promos, forKey: "promos")
        ud.set(sound, forKey: "sound")
        ud.set(vibration, forKey: "vibration")
    }
    
    init() {
        let ud = UserDefaults.standard
        dark = ud.bool(forKey: "dark")
        if let hex = ud.string(forKey: "accent") {
            accent = Color(hex: hex)
        }
        textScale = CGFloat(ud.double(forKey: "textScale").nonZero ?? 1.0)
        radius = CGFloat(ud.double(forKey: "radius").nonZero ?? 22)
        lang = ud.string(forKey: "lang") ?? "en"
        push = ud.object(forKey: "push") as? Bool ?? true
        messages = ud.object(forKey: "messages") as? Bool ?? true
        promos = ud.bool(forKey: "promos")
        sound = ud.object(forKey: "sound") as? Bool ?? true
        vibration = ud.object(forKey: "vibration") as? Bool ?? true
        discard()
    }
    
    var appearanceSummary: String {
        let colorName = colorName(pendingAccent)
        let sizeName = textScaleName(pendingTextScale)
        let styleName = radiusStyleName(pendingRadius)
        return "\(colorName) · \(sizeName) · \(styleName)"
    }
}

extension Double {
    var nonZero: Double? { self == 0 ? nil : self }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r)/255, green: Double(g)/255, blue: Double(b)/255, opacity: Double(a)/255)
    }
    
    func toHex() -> String {
        let uiColor = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0
        uiColor.getRed(&r, green: &g, blue: &b, alpha: nil)
        return String(format: "%02X%02X%02X", Int(r*255), Int(g*255), Int(b*255))
    }
}

func colorName(_ color: Color) -> String {
    switch color.toHex() {
    case "7C5CFF": return "Violet"
    case "FF4D8D": return "Rose"
    case "3B82F6": return "Blue"
    case "22C55E": return "Green"
    case "F59E0B": return "Amber"
    default: return "Custom"
    }
}

func textScaleName(_ scale: CGFloat) -> String {
    if scale <= 0.9 { return "Small" }
    if scale <= 1.0 { return "Default" }
    if scale <= 1.15 { return "Large" }
    return "X-Large"
}

func radiusStyleName(_ r: CGFloat) -> String {
    if r >= 20 { return "Rounded" }
    if r >= 12 { return "Soft" }
    return "Crisp"
}

func languageName(_ code: String) -> String {
    switch code {
    case "en": return "English"
    case "fr": return "Français"
    case "es": return "Español"
    case "de": return "Deutsch"
    case "pt": return "Português"
    case "it": return "Italiano"
    case "uz": return "O‘zbekcha"
    case "ru": return "Русский"
    default: return code.uppercased()
    }
}
