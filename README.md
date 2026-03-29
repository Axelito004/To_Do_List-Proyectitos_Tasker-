# 🛡️ Proyectitos_Tasker

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Plataforma web interactiva orientada a la gestión, seguimiento y auditoría de proyectos. Desarrollada con un enfoque estricto en la seguridad de datos (RLS) y la fluidez de la experiencia de usuario, prescindiendo de frameworks pesados para garantizar tiempos de respuesta milimétricos.

## 🔗 Enlace a Producción
**[🚀 Ver la aplicación en vivo aquí](https://axelito004.github.io/To_Do_List-Proyectitos_Tasker-/)**

---

## ⚙️ Características Principales

* **Autenticación Blindada:** Sistema de Login y registro gestionado a través de **Supabase Auth**, asegurando el acceso mediante tokens de sesión criptográficos.
* **Sistema CRUD Completo:** Creación, Lectura, Actualización y Eliminación de tareas y proyectos mediante peticiones asíncronas (`async/await`) a la base de datos PostgreSQL.
* **Cálculo Algorítmico de Progreso:** Barras de estado dinámicas que calculan en tiempo real el porcentaje de culminación de cada proyecto con feedback visual reactivo.
* **Seguridad RLS (Row Level Security):** Políticas de base de datos estrictas. Cada consulta evalúa el `auth.uid()` del usuario, garantizando que los datos estén aislados y protegidos contra inyecciones externas.
* **Feed de Inteligencia (API REST):** Integración nativa con la API pública de *Dev.to* para consumir y renderizar en tiempo real los últimos artículos sobre ciberseguridad, eludiendo restricciones de CORS.

---

## 🏗️ Arquitectura Técnica

El ecosistema de la aplicación se divide en:
1. **Frontend:** Construido puramente con HTML5, CSS3 y Vanilla JavaScript.
2. **Backend as a Service (BaaS):** Supabase (PostgreSQL) para la persistencia de datos y gestión de identidades.
3. **Despliegue (CI/CD):** Alojado en el servidor global de GitHub Pages.

---

## 👨‍💻 Desarrollador

**AXL-HACKING**
*Estudiante de Ingeniería de Sistemas | UNEFA (Núcleo Yaracuy - San Felipe)*

Tutor - Ing. Josue Ordoñez.

Apasionado por la **ciberseguridad, el hacking ético y el desarrollo de software**. Orientado a la creación de herramientas y soluciones seguras utilizando tecnologías como Kali Linux, Python, C++ y arquitecturas web modernas.

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/axelito004)