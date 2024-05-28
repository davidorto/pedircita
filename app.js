const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const ical = require('ical-generator').default; // Importar correctamente
const path = require('path');

const app = express();
const port = 3000;

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware para servir archivos estáticos y parsear formularios
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de Nodemailer
var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "79b388a94512b6",
        pass: "4acc47a333604c"
    }
});

// Ruta principal para servir el formulario
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para manejar la creación de citas
app.post('/create-appointment', upload.single('photo'), (req, res) => {
    const { name, email, date } = req.body;
    const photoPath = req.file.path;

    // Crear evento iCal
    const cal = ical({ name: 'Cita' });
    cal.createEvent({
        start: new Date(date),
        end: new Date(new Date(date).getTime() + 60 * 60 * 1000),
        summary: `Cita con ${name}`,
        description: `Cita solicitada por ${name}`,
        location: 'Oficina',
        organizer: { name: 'Administrador', email: 'davidoortiz38@gmail.com' },
        attendees: [
            { name: name, email: email, rsvp: true },
            { name: 'Administrador', email: 'davidoortiz38@gmail.com', rsvp: true }
        ]
    });

    const icalEvent = cal.toString();

    const mailOptions = {
        from: 'davidoortiz38@gmail.com',
        to: [email, 'davidoortiz38@gmail.com', req.body.email], // Agregar el correo proporcionado por el cliente
        subject: 'Nueva Cita Programada',
        text: `Hola ${name},\n\nTu cita ha sido programada para ${date}.\n\nGracias.`,
        attachments: [
            {   // Enviar archivo iCal
                filename: 'cita.ics',
                content: icalEvent
            },
            {   // Enviar la foto subida
                filename: req.file.originalname,
                path: photoPath
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.send('Cita creada y notificación enviada!');
    });
});

// Ruta para probar el envío de correos
app.get('/send-test-email', (req, res) => {
    const mailOptions = {
        from: 'davidoortiz38@gmail.com',
        to: 'destinatario@correo.com',
        subject: 'Prueba de envío de correo',
        text: 'Este es un correo de prueba para verificar la configuración de Nodemailer.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.send('Correo de prueba enviado: ' + info.response);
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
