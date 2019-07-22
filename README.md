# horarios_uninorte_api

## Project setup (Manual)
```
npm install
```

### Run in development environment
```
npm run dev
```

### Run in production environment
```
npm start
```

## Project setup (Docker)
Make _build.docker.sh, start.dev.sh and start.prod.sh_ executable, e.g. Ubuntu: _chmod +x filename.sh_.

## Run in development environment
```
./build.docker.sh
./start.dev.sh
```

## Run in production environment
```
./build.docker.sh
./start.prod.sh
```

## API reference
The routes detailed below have just GET method available.

Note:
- period: e.g. 201830, 201910, 201930, ...
- level: e.g. PR: 'Pregrado', PG: 'Postgrado', EC: 'Educación Continua' and EX: 'Extracurricular'.
- subj_code: code that identifies the set of subjects.
- course: code that identifies a subject, within the set of subjects to which it belongs.
- nrc: is the reference number of the course, which identifies a group.

e.g. DIG0030, subj_code: DIG and course: 0030.

### /periodos
Return available periods for requesting schedule e.g. 201930, 201910, ...

Params: (none)

### /niveles
Return available levels for requesting schedule e.g. 

Params: (none)

### /departamentos
Return all department code.

Params: (none)

### /asignaturas/all
Return all subjects avalilable.

Params: 
- period
- level

### /grupo/det
Return group details.

Params:
- nrc
- period
- level

### /grupos/subj/det
Return detailed subject groups information.

Params:
- subj_code
- course
- period
- level

### /grupos/dep
Return department groups.

Params:
- dep_code
- period
- level

### /grupos/all
Return all groups.

Params:
- period
- level