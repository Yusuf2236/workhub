using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using WorkHub.Desktop.Models;

namespace WorkHub.Desktop.Services
{
    public class WorkHubApiClient
    {
        private readonly HttpClient _httpClient;
        private const string DefaultBaseUrl = "http://localhost:8080/api/v1";

        public WorkHubApiClient(string? baseUrl = null)
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(baseUrl ?? DefaultBaseUrl)
            };
        }

        public async Task<AnalyticsData?> GetAnalyticsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("admin/analytics");
                if (!response.IsSuccessStatusCode) return null;

                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                if (doc.RootElement.TryGetProperty("data", out var dataElement))
                {
                    return JsonSerializer.Deserialize<AnalyticsData>(dataElement.GetRawText());
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error querying analytics: {ex.Message}");
            }
            return null;
        }

        public async Task<List<Vacancy>> GetVacanciesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("vacancies");
                if (!response.IsSuccessStatusCode) return new List<Vacancy>();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                if (doc.RootElement.TryGetProperty("data", out var dataElement) &&
                    dataElement.TryGetProperty("vacancies", out var vacListElement))
                {
                    return JsonSerializer.Deserialize<List<Vacancy>>(vacListElement.GetRawText()) ?? new List<Vacancy>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error querying vacancies: {ex.Message}");
            }
            return new List<Vacancy>();
        }
    }
}
