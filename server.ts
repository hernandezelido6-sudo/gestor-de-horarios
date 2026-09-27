
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clave de API GEMINI_API_KEY no está configurada en los Secretos de la aplicación.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

const DB_FILE = path.resolve('db.json');

// Initial database structure
const initialData = {
  availabilities: [],
  classes: [],
  messages: [],
  settings: {
    hours: ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00']
  }
};

// Helper to read/write DB
const getDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  if (!db.settings) {
    db.settings = initialData.settings;
    saveDB(db);
  }
  return db;
};

const saveDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API Routes
  app.get('/api/data', (req, res) => {
    res.json(getDB());
  });

  app.post('/api/availability', (req, res) => {
    const db = getDB();
    const newAvailability = req.body;
    
    // Replace existing availability for the same teacher or ID
    db.availabilities = [
      newAvailability,
      ...db.availabilities.filter((a: any) => a.id !== newAvailability.id && a.name !== newAvailability.name)
    ];
    
    saveDB(db);
    io.emit('data_updated', db);
    res.json({ success: true });
  });

  app.delete('/api/availability/:id', (req, res) => {
    const db = getDB();
    const id = req.params.id;
    
    db.availabilities = db.availabilities.filter((a: any) => a.id !== id);
    
    saveDB(db);
    io.emit('data_updated', db);
    res.json({ success: true });
  });

  app.post('/api/classes', (req, res) => {
    const db = getDB();
    db.classes = req.body;
    saveDB(db);
    io.emit('data_updated', db);
    res.json({ success: true });
  });

  app.post('/api/messages', (req, res) => {
    const db = getDB();
    const newMessage = {
      ...req.body,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    db.messages.push(newMessage);
    saveDB(db);
    io.emit('data_updated', db);
    res.json(newMessage);
  });

  app.post('/api/settings', (req, res) => {
    const db = getDB();
    db.settings = { ...db.settings, ...req.body };
    saveDB(db);
    io.emit('data_updated', db);
    res.json({ success: true, settings: db.settings });
  });

  app.post('/api/ai-grade', async (req, res) => {
    try {
      const { classes, teachers, sector, language = 'es' } = req.body;
      
      const teacherInfo = teachers && teachers.length > 0
        ? teachers.map((t: any) => `- Docente: ${t.name}, Especialidad: ${t.subject || 'General'}, Bloques de disponibilidad: ${JSON.stringify(t.slots || [])}`).join('\n')
        : 'No hay datos de docentes disponibles.';
      
      const systemSectorClasses = classes && classes.length > 0
        ? classes.filter((c: any) => c.sector === sector)
        : [];
      
      const classesSummary = systemSectorClasses.length > 0
        ? systemSectorClasses.map((c: any) => `- Grupo: ${c.group}, Materia: ${c.subject}, Docente: ${c.teacher}, Día: ${c.day}, Hora: ${c.hour}, Aula: ${c.room}`).join('\n')
        : 'No hay clases asignadas actualmente en este sector.';
        
      const prompt = `Analiza el siguiente diseño de horario escolar de ${sector} y genera un informe de auditoría pedagógica detallado.
      
      ### REGLAS DE ANÁLISIS:
      1. Evalúa si hay choques o colisiones de docentes (un docente asignado a la misma hora y día a diferentes grupos).
      2. Evalúa si el docente tiene disponibilidad registrada en las horas en que fue asignado.
      3. Analiza si los alumnos tienen "horas libres / huecos" (student gaps) indeseados en su jornada diaria.
      4. Revisa si hay ventanas excesivas (horas muertas entre clase y clase) para los profesores.
      5. Analiza la asignación de aulas (salón de clase), verificando que no se encimen grupos.
      6. Calcula una calificación numérica final (del 1.0 al 10.0), donde 10.0 representa un horario perfecto libre de choques y con alta eficiencia pedagógica.

      ### DATOS DEL HORARIO ACTUAL:
      ${classesSummary}

      ### DATOS DE DISPONIBILIDAD DOCENTE:
      ${teacherInfo}
      
      Por favor, genera la respuesta estructurada en formato JSON estricto con el esquema especificado. Toda la información explicativa debe estar traducida al idioma del sistema: ${language === 'es' ? 'Español' : 'Inglés'}.`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres el Coordinador Académico del Instituto Juan Pablo II. Tu misión es analizar las inconsistencias de los horarios de secundaria y preparatoria para asegurar la excelencia operacional, libre de conflictos y con una distribución horaria humana y cómoda para alumnos y docentes. Responde única y estrictamente con un JSON estructurado de acuerdo al esquema solicitado.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { 
                type: Type.NUMBER, 
                description: "Calificación global del horario del 1.0 al 10.0, descontando puntos de forma justa por choques, sobreocupación, huecos y asimetrías." 
              },
              summary: { 
                type: Type.STRING, 
                description: "Resumen ejecutivo claro y directo sobre el estado de este horario." 
              },
              highlights: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Lista de 2-4 ventajas o aciertos específicos en la diagramación del horario." 
              },
              problems: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Lista de todos los problemas encontrados: docentes empalmados, faltas de disponibilidad, ventanas molestas, salones duplicados." 
              },
              recommendations: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Plan detallado de qué días y horas mover la materia X para solucionar cada uno de los problemas encontrados." 
              }
            },
            required: ["score", "summary", "highlights", "problems", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedReport = JSON.parse(responseText.trim());
      res.json(parsedReport);
    } catch (error: any) {
      console.error("AI grading failed:", error.message || error);
      res.status(500).json({ 
        error: error.message || "No se pudo generar la calificación con IA.", 
        isKeyMissing: !process.env.GEMINI_API_KEY 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*all', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
