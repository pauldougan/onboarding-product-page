import {Request, Response} from "express";
import Validation from "../lib/validation";
import uuid from "../lib/uuid";
import getTimestamp from "../lib/timestamp";
import SheetsService from "../lib/sheets/SheetsService";

const requiredFields = new Map<string, string>([
    ["name", "Enter your name"],
    ["organisation-name", "Enter your organisation name"],
    ["email", "Enter your government email address"],
    ["service-name", "Enter the name of your service"],
    ["mailing-list", "Select if you’d like to join the mailing list or not"]
]);

export const get = function (req: Request, res: Response) {
    res.render("register.njk");
};

export const post = async function (req: Request, res: Response) {
    const values = new Map<string, string>(Object.entries(req.body));
    values.forEach((value, key) => values.set(key, value.trim()));

    const errorMessages = (req.app.get("validation") as Validation).validate(values, requiredFields);

    if (errorMessages.size == 0) {
        values.set("id", uuid());
        values.set("submission-date", getTimestamp());

        let redirectTo = "/register-confirm";

        const sheetsService: SheetsService = new SheetsService(process.env.REGISTER_SPREADSHEET_ID as string);
        await sheetsService.init().catch(() => (redirectTo = "/register-error"));
        await sheetsService
            .appendValues(values, process.env.REGISTER_SHEET_DATA_RANGE as string, process.env.REGISTER_SHEET_HEADER_RANGE as string)
            .catch(reason => {
                console.log(reason);
                redirectTo = "/register-error";
            });

        if (values.get("mailing-list") === "yes") {
            values.set("service", values.get("service-name") as string);
            values.set("organisation", values.get("organisation-name") as string);
            const sheetsService: SheetsService = new SheetsService(process.env.MAILING_LIST_SPREADSHEET_ID as string);
            await sheetsService.init().catch(() => (redirectTo = "/register-error"));
            await sheetsService
                .appendValues(
                    values,
                    process.env.MAILING_LIST_SHEET_DATA_RANGE as string,
                    process.env.MAILING_LIST_SHEET_HEADER_RANGE as string
                )
                .catch(reason => {
                    console.log(reason);
                    redirectTo = "/register-error";
                });
        }

        console.log("Saved to sheets");
        res.redirect(redirectTo);
    } else {
        res.render("register.njk", {
            errorMessages: errorMessages,
            values: values
        });
    }
};

export const confirm = function (req: Request, res: Response) {
    res.render("register-confirm.njk");
};

export const error = function (req: Request, res: Response) {
    res.render("register-error.njk");
};
