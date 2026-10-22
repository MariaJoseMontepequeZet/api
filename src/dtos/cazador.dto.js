export class CredencialesDTO{
    constructor(data ={}){
        this.username=String(data.username ?? "").trim().toLowerCase();
        this.password = String(data.password ?? "");
    }
}

export class PerfilCazadorDTO {
    constructor(cazador = {}){
        this.id = String(cazador.id ?? cazador._id ?? "");

        this.username = cazador.username;

        this.name = cazador.name;

        this.rango = cazador.rango ?? "B";

        this.admin = Boolean(cazador.admin ?? false);
    }
}

export class CrearRecompensaDTO {
    constructor(data = {}){
        this.mision = String(data.mision ?? "").trim();

        this.cristales = Number(data.cristales ?? 0);
    }
}