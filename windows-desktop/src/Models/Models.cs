using System;
using System.Text.Json.Serialization;

namespace WorkHub.Desktop.Models
{
    public class Vacancy
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("company")]
        public string Company { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string Location { get; set; } = string.Empty;

        [JsonPropertyName("salary")]
        public string Salary { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public class AnalyticsData
    {
        [JsonPropertyName("total_users")]
        public int TotalUsers { get; set; }

        [JsonPropertyName("total_vacancies")]
        public int TotalVacancies { get; set; }

        [JsonPropertyName("total_applications")]
        public int TotalApplications { get; set; }

        [JsonPropertyName("total_resumes")]
        public int TotalResumes { get; set; }
    }
}
