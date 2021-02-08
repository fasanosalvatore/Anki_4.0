*The Anki 4.0 project was developed in the context of the Cloud Computing exam at the University of Saleno*

Anki 4.0 is a bot for Telegram, easily adaptable to other platforms, which exploits the services provided by Microsoft Azure. The purpose of the bot is to help students in the study / repetition phase.

The bot is based on one of the most famous study methods in the world, the **flashcard** method, combined with the concept of **spaced repetition**.

### Flashcard

### Ripetizione Spaziata

## Prerequisites
- [An Azure Subscription](https://portal.azure.com/)
- Node.js
- Python
- [Azure CLI](https://docs.microsoft.com/it-it/cli/azure/install-azure-cli)
- [ngrok](https://ngrok.com/)
- [Question Generate Model](https://drive.google.com/file/d/1mUAh_2PEHy9_hheN4IGzIWqCZtFKSBkM/view?usp=sharing)
- [Check Answer Model](https://sbert.net/models/stsb-roberta-base.zip)


## Resources
Based on [Azure Bot Service](https://docs.microsoft.com/en-us/azure/bot-service) ISISLabHelpDesk utilises some resources on Microsoft Azure to run, furthermore the available functionalities exploit several Azure services that are connected to the bot using specific credentials.
In this section a tutorial for the creation of all the required Azure resources is proposed, both the [Portal](https://portal.azure.com) and the Azure CLI will be used. In order to maintain the cost low as much as possible will be chosen the free tier when available.

**REMINDER** Every resource on Cloud needs some deployment time that in some cases can be quite long, be patient.

### Machine Learning

The Azure Machine Learning service empowers developers and data scientists with a wide range of productive experiences for building, training, and deploying machine learning models faster. Accelerate time to market and foster team collaboration with industry-leading MLOps—DevOps for machine learning.
Anki4.0 uses Machine Learning services for the creation of contaners, which expose the edpoits of our models.

In this section, you will learn how to deploy the models for creating questions and verifying answers.

Using the Azure Portal.
1. Create a new resource and using the search bar find 'Machine Learning'.
2. Provide the details for the Subscription, Resource Group and the name. 
4. Leave all the others fields as default.

When the resource is been correctly deployed go to resource.

1. Donwload `Question Generate Model` and extract into `/multi-qg-qa` folder.
2. Donwload `Check Answer Model` and extract into `/checkanswer/models` folder.
3. In `MachineLearning/loader.py` enter the missing data required from the file. you can find them on the main page of the resource. Then run commands below.
```sh
$ pip install azureml-sdk
$ python MachineLearning/loader.py
```
4. Wait for the script to finish.
5. Go `MachineLearning/multi-qg-qa` folder and run the script below.
```sh
$ az ml model deploy -n qgenerationn -m qgeneration:1 --ic inferenceconfig.json --dc deploymentconfig.json -w WORKSPACE_NAME -g RESOUCEGROUP_NAME
```
6. Go `MachineLearning/checkanswer` folder and run the script below.
```sh
$ az ml model deploy -n checkanswer -m checkanswer:1 --ic inferenceconfig.json --dc deploymentconfig.json -w WORKSPACE_NAME -g RESOUCEGROUP_NAME
```
Now both containers have been deployed. It may take several minutes for them to start.
Through the "Studio web URL" field inside the resource it is possible to monitor the cotainers and the registered models.
Inside, in the endpoint section you can view the links to query the generated endpoint.





