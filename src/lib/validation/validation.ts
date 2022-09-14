const emailValidator = require("./email-validator");
import fs from "fs";
import FormFields from "../../types/form-fields";

export default class Validation {
    validEmailDomains: string[];
    static instance: Validation;

    constructor() {
        this.validEmailDomains = [];
        console.log("Loading list of valid email domains.");
        try {
            const emails = fs.readFileSync("./valid-email-domains.txt", "utf-8");
            this.validEmailDomains = emails.split("\n");
        } catch (error) {
            console.error("List of valid email domains could not be loaded.");
            console.error(error);
            process.kill(process.pid, "SIGTERM");
        }
    }

    validate(form: Map<string, string>, requiredFields: Map<string, string> | FormFields): Map<string, string> {
        const errors = new Map();

        Array.from(requiredFields.keys()).forEach(field => {
            const value = requiredFields.get(field);

            if (!value) {
                console.error(`Validation information missing for field ${field}`);
                return;
            }

            const missingValueMessage = typeof value === "string" ? value : value?.missingValueMessage;
            const message = this.getErrorMessage(field, form, missingValueMessage);
            if (message) {
                errors.set(field, message);
            }
        });

        return errors;
    }

    getErrorMessage(field: string, form: Map<string, string>, missingValueMessage: string): string | undefined {
        if (this.fieldHasNoValue(field, form)) {
            return missingValueMessage;
        }

        if (field === "email") {
            if (this.invalidEmailAddress(form)) {
                return "Enter an email address in the correct format, like name@gov.uk";
            }

            if (this.notGovernmentEmail(form)) {
                return "Enter a government email address";
            }
        }
    }

    fieldHasNoValue(field: string, form: Map<string, string>): boolean {
        return form.get(field) == "" || form.get(field) == undefined;
    }

    invalidEmailAddress(form: Map<string, string>): boolean {
        return !emailValidator(form.get("email"));
    }

    notGovernmentEmail(form: Map<string, string>): boolean {
        // "" will match anything and we get that if there's an empty line at the end of valid-email-domains.txt
        const match = this.validEmailDomains.find(suffix => {
            // @ts-ignore
            return form.get("email").trim().endsWith(suffix) && suffix != "";
        });
        return match == undefined;
    }

    static getInstance() {
        if (!Validation.instance) {
            Validation.instance = new Validation();
        }
        return Validation.instance;
    }
}
