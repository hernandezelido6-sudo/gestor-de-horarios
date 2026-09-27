
import { Sector } from './types';

export const CURRICULUM = {
  [Sector.PREPARATORY]: {
    semesters: {
      1: [
        'Lengua y Comunicación I',
        'Pensamiento Matemático I',
        'Ciencias Naturales, Experimentales y Tecnología I',
        'Ciencias Sociales I',
        'Laboratorio de Investigación',
        'Pensamiento Filosófico y Humanidades I',
        'Cultura Digital I',
        'Inglés I',
        'Formación Socioemocional I'
      ],
      2: [
        'Lengua y Comunicación II',
        'Pensamiento Matemático II',
        'Ciencias Naturales, Experimentales y Tecnología II',
        'Taller de Ciencias',
        'Ciencias Sociales II',
        'Pensamiento Filosófico y Humanidades II',
        'Cultura Digital II',
        'Inglés II',
        'Formación Socioemocional II'
      ],
      3: [
        'Lengua y Comunicación III',
        'Pensamiento Matemático III',
        'Ciencias Naturales, Experimentales y Tecnología III',
        'Pensamiento Filosófico y Humanidades III',
        'Inglés III',
        'Submódulo I',
        'Submódulo II',
        'Formación de Trabajo',
        'Formación Socioemocional III'
      ],
      4: [
        'Pensamiento Matemático IV',
        'Ciencias Naturales, Experimentales y Tecnología IV',
        'Ciencias Sociales III',
        'Conciencia Histórica I',
        'Pensamiento Literario',
        'Cultura Digital III',
        'Inglés IV',
        'Submódulo III',
        'Submódulo IV',
        'Formación de Trabajo',
        'Formación Socioemocional IV'
      ],
      5: [
        'Pensamiento Matemático V',
        'Ciencias Naturales, Experimentales y Tecnología V',
        'Conciencia histórica II. Mexico durante el expansionismo capitalista',
        'La energía en los proceso de la vida diaria',
        'Inglés V',
        'Asignatura del Componente de Formación Fundamental Extendida (Optativa)',
        'Submódulo V',
        'Submódulo VI',
        'Formación Socioemocional V'
      ],
      6: [
        'Pensamiento Matemático VI',
        'Ciencias Naturales, Experimentales y Tecnología VI',
        'Conciencia histórica III. Realidad actual en perspectiva histórica',
        'Organismos estructurar y procesos, herencia y evolución biológica',
        'Inglés VI',
        'Asignatura del Componente de Formación Fundamental Extendida (Optativa)',
        'Submódulo VII',
        'Submódulo VIII',
        'Formación Socioemocional VI'
      ]
    },
    specialties: [
      'Informática',
      'Servicios Turísticos',
      'Dibujo Arquitectónico y de Construcción',
      'Contabilidad',
      'Turismo Alternativo',
      'Auxiliar de Enfermería',
      'Laboratorista Químico',
      'Primeros Auxilios'
    ],
    areas: [
      'Físico-Matemático',
      'Químico-Biológico',
      'Económico-Administrativo',
      'Humanidades y Ciencias Sociales'
    ],
    groups: {
      1: ['A', 'B', 'C', 'D', 'E', 'F'],
      2: ['A', 'B', 'C', 'D', 'E', 'F'],
      3: ['A', 'B', 'C', 'D', 'E'],
      4: ['A', 'B', 'C', 'D', 'E'],
      5: ['A', 'B', 'C', 'D', 'E'],
      6: ['A', 'B', 'C', 'D', 'E']
    }
  },
  [Sector.SECONDARY]: {
    groups: ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'],
    grades: {
      1: [
        'Artes I',
        'Biología I',
        'Educación Física I',
        'Español I',
        'Formación Cívica y Ética I',
        'Geografía I',
        'Historia I',
        'Inglés I',
        'Matemáticas I',
        'Tecnología I',
        'Tutoría y Orientación Educ. I',
        'Talleres: Miércoles de 7:00 a 8:40 hrs.',
        'Clubes: Jueves de 7:00 a 8:40 hrs.'
      ],
      2: [
        'Educación Física II',
        'Español II',
        'Física II',
        'Formación Cívica y Ética II',
        'Historia II',
        'Inglés II',
        'Matemáticas II',
        'Música II',
        'Tecnología II',
        'Tutoría y Orientación Educ. II',
        'Talleres: Miércoles de 7:00 a 8:40 hrs.',
        'Clubes: Jueves de 7:00 a 8:40 hrs.'
      ],
      3: [
        'Educación Física III',
        'Español III',
        'Formación Cívica y Ética III',
        'Historia III',
        'Inglés III',
        'Matemáticas III',
        'Química III',
        'Teatro III',
        'Tecnología III',
        'Tutoría y Orientación Educ. III',
        'Talleres: Miércoles de 7:00 a 8:40 hrs.',
        'Clubes: Jueves de 7:00 a 8:40 hrs.'
      ]
    },
    subjects: [
      'Artes I',
      'Biología I',
      'Educación Física I',
      'Español I',
      'Formación Cívica y Ética I',
      'Geografía I',
      'Historia I',
      'Inglés I',
      'Matemáticas I',
      'Tecnología I',
      'Tutoría y Orientación Educ. I',
      'Educación Física II',
      'Español II',
      'Física II',
      'Formación Cívica y Ética II',
      'Historia II',
      'Inglés II',
      'Matemáticas II',
      'Música II',
      'Tecnología II',
      'Tutoría y Orientación Educ. II',
      'Educación Física III',
      'Español III',
      'Formación Cívica y Ética III',
      'Historia III',
      'Inglés III',
      'Matemáticas III',
      'Química III',
      'Teatro III',
      'Tecnología III',
      'Tutoría y Orientación Educ. III',
      'Talleres: Miércoles de 7:00 a 8:40 hrs.',
      'Clubes: Jueves de 7:00 a 8:40 hrs.'
    ]
  }
};

export const SCHOOL_STATS = {
  totalGroups: 25,
  preparatoryGroups: 16,
  secondaryGroups: 9,
  totalTeachers: 39,
  secondaryClassrooms: 9
};

export const PREPARATORY_ROOMS = [
  'SEMESTRE 1 - A',
  'SEMESTRE 1 - B',
  'SEMESTRE 1 - C',
  'SEMESTRE 1 - D',
  'SEMESTRE 1 - E',
  'SEMESTRE 1 - F',
  'SEMESTRE 2 - A',
  'SEMESTRE 2 - B',
  'SEMESTRE 2 - C',
  'SEMESTRE 2 - D',
  'SEMESTRE 2 - E',
  'SEMESTRE 2 - F',
  'SEMESTRE 3 - A',
  'SEMESTRE 3 - B',
  'SEMESTRE 3 - C',
  'SEMESTRE 3 - D',
  'SEMESTRE 3 - E',
  'SEMESTRE 4 - A',
  'SEMESTRE 4 - B',
  'SEMESTRE 4 - C',
  'SEMESTRE 4 - D',
  'SEMESTRE 4 - E',
  'SEMESTRE 5 - A',
  'SEMESTRE 5 - B',
  'SEMESTRE 5 - C',
  'SEMESTRE 5 - D',
  'SEMESTRE 5 - E',
  'SEMESTRE 6 - A',
  'SEMESTRE 6 - B',
  'SEMESTRE 6 - C',
  'SEMESTRE 6 - D',
  'SEMESTRE 6 - E'
];

export const SECONDARY_ROOMS = [
  '1A',
  '1B',
  '1C',
  '2A',
  '2B',
  '2C',
  '3A',
  '3B',
  '3C'
];
