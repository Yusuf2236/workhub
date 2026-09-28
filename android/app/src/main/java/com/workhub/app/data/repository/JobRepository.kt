package com.workhub.app.data.repository

import com.workhub.app.data.api.ApiClient
import com.workhub.app.data.models.Application
import com.workhub.app.data.models.User
import com.workhub.app.data.models.Vacancy
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class JobRepository {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _vacancies = MutableStateFlow<List<Vacancy>>(emptyList())
    val vacancies: StateFlow<List<Vacancy>> = _vacancies.asStateFlow()

    private val _applications = MutableStateFlow<List<Application>>(emptyList())
    val applications: StateFlow<List<Application>> = _applications.asStateFlow()

    fun setAuthSession(user: User, token: String) {
        _currentUser.value = user
        ApiClient.authToken = token
    }

    fun clearSession() {
        _currentUser.value = null
        ApiClient.authToken = null
    }

    fun updateVacancies(list: List<Vacancy>) {
        _vacancies.value = list
    }

    fun addApplication(application: Application) {
        _applications.value = _applications.value + application
    }
}
