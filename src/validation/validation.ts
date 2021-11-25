const emailValidator = require('../email-validator');

export default class Validation {
    form: any;
    requiredFields: Map<string, string>;
    requiredConditionalFields: Map<string, Map<string, string>>;
    validEmailDomains: string[];

    constructor(form: any) {
        this.form = form;

        this.requiredFields = new Map<string, string>();
        this.requiredFields.set("email", "Enter your government email address");
        this.requiredFields.set("name", "Enter your name");
        this.requiredFields.set("role", "Enter your role");
        this.requiredFields.set("service-name", "Enter the name of your service");
        this.requiredFields.set("department-name", "Enter your organisation");
        this.requiredFields.set("phase", "Select the phase you are in");
        this.requiredFields.set("assessment", "Select yes if you have passed the relevant GDS service assessment");
        this.requiredFields.set("host", "Select yes if your service is on GOV.UK");
        this.requiredFields.set("development", "Select yes if you have a development team");
        this.requiredFields.set("auth-need", "Select yes if your service needs authentication");
        this.requiredFields.set("auth-exist", "Select yes if you already have an authentication solution");
        this.requiredFields.set("id-need", "Select yes if you have identity needs");

        this.requiredConditionalFields = new Map<string, Map<string, string>>();
        this.requiredConditionalFields.set("auth-exist", new Map([["auth-existing", "Enter the name of your authentication solution"]]));
        this.requiredConditionalFields.set("id-need", new Map([["id-needs", "You must describe your identity needs"]]));

        this.validEmailDomains = // get this from config eventually
            [
                "gov.uk",
                "nhs.uk",
                "nhs.net",
                "nhs.scot",
                "police.uk",
                "cjsm.net",
                "ac.uk",
                "sch.uk",
                "onevoicewales.wales",
                "suttonmail.org",
                "highwaysengland.co.uk"
            ]
    }

    validate(): Map<string, string> {
        const errors = new Map();

        this.requiredFields.forEach((errorMessage, field) => {
            if (this.fieldHasNoValue(field)) {
                errors.set(field, errorMessage);
            }
        });

        this.requiredConditionalFields.forEach((conditionalFieldAndErrorMessage, field) => {
            if (this.form[field] == "yes") {
                let entry = conditionalFieldAndErrorMessage.entries().next().value
                if (this.fieldHasNoValue(entry[0])) {
                    errors.set(entry[0], entry[1]);
                }
            }
        });

        if(!errors.has('email')) {
            if(this.invalidEmailAddress()) {
                errors.set('email', 'Enter an email address in the correct format, like name@gov.uk');
            }
            else if(this.notGovernmentEmail()) {
                errors.set('email', 'You must enter a government email address');
            }
        }

        return errors;
    }

    fieldHasNoValue(field: string): boolean {
        return this.form[field] == '' || this.form[field] == undefined;
    }

    invalidEmailAddress(): boolean {
        return !emailValidator(this.form['email'])
    }

    notGovernmentEmail(): boolean {
        return this.validEmailDomains.filter(suffix => this.form['email'].trim().endsWith(suffix)).length == 0;
    }
}


