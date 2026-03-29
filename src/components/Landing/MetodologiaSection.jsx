import React from 'react';
import { ChartBarIcon, DevicePhoneMobileIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const MetodologiaSection = () => {
  return (
    <section id="metodologia" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la sección */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-4">
            Tecnología Aplicada al Deporte
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No solo entrenamos, medimos el crecimiento. Somos el único club que utiliza una 
            plataforma propia para el seguimiento detallado de cada deportista.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Columna de Texto/Beneficios */}
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">Evaluación Mensual con Datos</h3>
                <p className="text-gray-600">
                  Realizamos pruebas técnicas y físicas mensuales. Los resultados se cargan en nuestra 
                  plataforma para generar un historial de progreso real por cada niño.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600 p-3 rounded-lg">
                <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">Plataforma Exclusiva Cezeus</h3>
                <p className="text-gray-600">
                  Cada deportista cuenta con un perfil digital donde se registran sus asistencias, 
                  avances en habilidades y su carnetización digital oficial.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600 p-3 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">Gráficos de Rendimiento</h3>
                <p className="text-gray-600">
                  Visualizamos las fortalezas y áreas de mejora mediante gráficas de radar, 
                  permitiendo a los padres conocer el nivel exacto de su hijo en cada etapa.
                </p>
              </div>
            </div>
          </div>

          {/* Columna de Imagen/Mockup */}
          <div className="relative">
            <div className="bg-blue-100 rounded-2xl p-4 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white rounded-xl overflow-hidden shadow-inner border border-gray-200">
                {/* Aquí puedes colocar una captura real de tu plataforma. 
                  Si no tienes la imagen aún, este es un placeholder estilizado.
                */}
                <img 
                  src="/assets/img/dashboard-cezeus.png" 
                  alt="Vista previa de la plataforma de seguimiento Cezeus" 
                  className="w-full h-auto opacity-90"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Dashboard+Cezeus+App'; }}
                />
              </div>
            </div>
            {/* Elemento decorativo */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MetodologiaSection;