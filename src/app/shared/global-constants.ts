export class GlobalConstants {
    public static genericError: string = "Something went wrong. Please try again later!!";

    public static nameRegex: string = "[a-zA-Z0-9 ]*";
    public static emailRegex: string = "[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}";
    public static contactRegex: string = "^[e0-9]{10,10}$";

    public static error:string = "error";

    public static unautorised:string = "You are not authorised person to access this page.";
    
    public static productExistsError:string = "Product already exists";
    public static productAdded:string = "Product added successfully";
}