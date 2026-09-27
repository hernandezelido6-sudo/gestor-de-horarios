const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve('db.json');

const subjects = [
  'Matemáticas', 'Física', 'Química', 'Biología', 
  'Historia', 'Geografía', 'Literatura', 'Inglés',
  'Educación Física', 'Arte', 'Música', 'Informática'
];

const firstNames = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Elena',
  'Pedro', 'Laura', 'Diego', 'Carmen', 'Jorge', 'Sofía',
  'Miguel', 'Lucía', 'David', 'Paula', 'Javier', 'Raquel'
];

const lastNames = [
  'García', 'Martínez', 'López', 'González', 'Rodríguez',
  'Fernández', 'Pérez', 'Gómez', 'Sánchez', 'Díaz',
  'Romero', 'Suárez', 'Torres', 'Ruiz', 'Alonso'
];

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const hours = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

const generateAvailabilities = () => {
  const numSlots = Math.floor(Math.random() * 10) + 5; // 5 to 14 slots
  const slots = new Set();
  while (slots.size < numSlots) {
    const day = days[Math.floor(Math.random() * days.length)];
    const hour = hours[Math.floor(Math.random() * hours.length)];
    slots.add(`${day}-${hour}`);
  }
  return Array.from(slots);
};

const teachers = Array.from({ length: 18 }).map((_, index) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  
  return {
    id: `teacher-${Date.now()}-${index}`,
    name,
    subject,
    subjects: [subject],
    slots: generateAvailabilities(),
    timestamp: new Date().toISOString()
  };
});

try {
  let dbData = {
    availabilities: [],
    classes: [],
    messages: []
  };

  if (fs.existsSync(DB_FILE)) {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    dbData = JSON.parse(rawData);
  }

  // Clear and populate only availabilities
  dbData.availabilities = teachers;

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  console.log('Database populated successfully with 18 teachers.');
} catch (error) {
  console.error('Error populating database:', error);
}
