# Post

The full-stack application

Instruction: 

Port which will be occupied: [3000, 4000, 5432]

Front-End: 

1) go to web directory 
2) install packages: npm i 
3) run the frontend environment: npm run dev

Back-End: 

1) go to server directory
2) install dependencies: npm i
3) run postgresql on its default port: 5432

command to start postgresql on MacOS if installed: brew services start postgresql

4) create user in postgresql local database and permit permissions with these commands:

CREATE ROLE admin WITH LOGIN PASSWORD 'test';
CREATE DATABASE testdb;
ALTER USER admin WITH SUPERUSER;

5) 
