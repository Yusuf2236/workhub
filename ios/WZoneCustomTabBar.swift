import SwiftUI
import UIKit

// MARK: - Вкладки навигации
enum WZoneTab: String, CaseIterable {
    case home = "Home"
    case vacancies = "Vakansiyalar"
    case add = ""
    case applications = "Arizalarim"
    case profile = "Profil"
    
    var iconName: String {
        switch self {
        case .home: return "house.fill"
        case .vacancies: return "briefcase"
        case .add: return "plus"
        case .applications: return "clock"
        case .profile: return "person"
        }
    }
}

// MARK: - Основной компонент BottomBar
struct WZoneCustomTabBar: View {
    @Binding var selectedTab: WZoneTab
    var onAddTapped: () -> Void
    
    // Фирменные цвета
    private let activeColor = Color(red: 0.18, green: 0.11, blue: 0.35)    // #2E1C59
    private let inactiveColor = Color(red: 0.56, green: 0.56, blue: 0.58)  // #8E8E93
    private let primaryPurple = Color(red: 0.42, green: 0.28, blue: 0.85)  // #6C47D8
    
    var body: some View {
        ZStack(alignment: .top) {
            // 1. Белая подложка с мягкой тенью и скруглением 32pt
            Color.white
                .clipShape(CustomRoundedCorner(radius: 32, corners: [.topLeft, .topRight]))
                .shadow(color: Color.black.opacity(0.06), radius: 16, x: 0, y: -4)
                .frame(height: 84)
            
            // 2. Элементы навигации
            HStack(spacing: 0) {
                // Home
                tabButton(tab: .home)
                
                // Vakansiyalar
                tabButton(tab: .vacancies)
                
                // Центральное пространство под кнопку (+)
                Spacer().frame(width: 60)
                
                // Arizalarim
                tabButton(tab: .applications)
                
                // Profil
                tabButton(tab: .profile)
            }
            .frame(height: 56)
            
            // 3. Центральная плавающая кнопка (+) с аурой (glow) - oq ramkasiz
            Button(action: {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                onAddTapped()
            }) {
                ZStack {
                    // Мягкое радиальное свечение точно по скриншоту
                    Circle()
                        .fill(primaryPurple.opacity(0.45))
                        .frame(width: 58, height: 58)
                        .blur(radius: 12)
                    
                    // Сама кнопка (toza binafsha, oq ramkasiz)
                    Circle()
                        .fill(primaryPurple)
                        .frame(width: 54, height: 54)
                    
                    Image(systemName: "plus")
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            .offset(y: -22) // Вынос наверх за пределы плашки
        }
    }
    
    // Кнопка обычной вкладки
    @ViewBuilder
    private func tabButton(tab: WZoneTab) -> some View {
        Button(action: {
            selectedTab = tab
        }) {
            VStack(spacing: 4) {
                Image(systemName: tab.iconName)
                    .font(.system(size: 21, weight: selectedTab == tab ? .semibold : .regular))
                    .foregroundColor(selectedTab == tab ? activeColor : inactiveColor)
                
                Text(tab.rawValue)
                    .font(.system(size: 11, weight: selectedTab == tab ? .bold : .medium))
                    .foregroundColor(selectedTab == tab ? activeColor : inactiveColor)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Вспомогательное скругление только верхних углов
struct CustomRoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
