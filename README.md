semaphore_wms
=============

Semaphore Workflow Management System is a web application to manage and run scientific experiments online. 
Typically, an experiment involves running a computer simulation using some modelling tools. 
To run the modelling tool, this application requires the execution service component. The source code for the execution service is located in a seperate GitHub repository:
https://github.com/QUT-IFE-eResearch/semaphore/tree/master/services/executor

## Documentation
All documentation including user and developer manual can found in the Semaphore [wiki](https://github.com/QUT-IFE-eResearch/semaphore/wiki).
To run your own service, you need to have all the prerequisite programs and libraries (NodeJS, MongoDB, Redis, Modelling tools, etc) and clone this and the [execution service](https://github.com/QUT-IFE-eResearch/semaphore/tree/master/services/executor) repositories.
For more details, please follow the [deployment guide](https://github.com/QUT-IFE-eResearch/semaphore/wiki/Semaphore-Web-Application-Deployment-Guide) in the Semaphore wiki.

## Acknowledgment
This project is supported by the Australian National Data Service (ANDS). 
ANDS is supported by the Australian Government through the National Collaborative Research Infrastructure Strategy
(NCRIS) Program and the Education Investment Fund (EIF) Super Science Initiative. 
The software is developed in conjunction with Queensland University of Technology (QUT) 
and The Australian Centre for Ecological Analysis and Synthesis (ACEAS).


## License 

(The GNU  Lesser General Public License)

Copyright (c) 2012-2013 Queensland University of Technology

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
