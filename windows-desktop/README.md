# WorkHub Windows desktop

The Windows desktop client is a native desktop experience for recruiters, admins, and power users who need a larger screen and more advanced operations.

## Stack

- .NET 8
- WPF or WinUI 3
- C#
- MVVM pattern
- REST API client

## Structure

```text
windows-desktop/
├── src/
│   ├── App.xaml
│   ├── MainWindow.xaml
│   ├── ViewModels/
│   ├── Views/
│   ├── Services/
│   ├── Models/
│   └── Core/
├── WorkHub.Desktop.csproj
├── WorkHub.Desktop.sln
├── README.md
└── appsettings.json
```

## Features

- login and authentication
- vacancy dashboard
- candidate and application lists
- analytics summary
- export reports
- desktop notifications

## API endpoint

```json
{
  "ApiBaseUrl": "http://localhost:8080/api/v1"
}
```

## Notes

The desktop client is an operational companion to the mobile apps and the admin dashboard. It is useful for users who need a richer local management interface without giving up the shared backend.
