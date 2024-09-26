import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { BillService } from 'src/app/services/bill.service';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { GlobalConstants } from 'src/app/shared/global-constants';

@Component({
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss']
})
export class ManageOrderComponent implements OnInit {
  displayedColumns:string[] = ['name', 'category', 'price', 'quantity', 'total', 'edit'];
  dataSource:any = [];
  manageOrderForm:any = FormGroup;
  categories:any = [];
  products:any = [];
  price:any;
  totalAmount:number = 0;
  responseMessage:any;

  constructor(
    private formBuilder: FormBuilder,
    private categorySevice: CategoryService,
    private productService: ProductService,
    private snackBarService: SnackbarService,
    private billService: BillService,
    private ngxService: NgxUiLoaderService
  ) { }

  ngOnInit(): void {
    this.ngxService.start();
    this.getCategories();
    this.manageOrderForm = this.formBuilder.group({
      name: [null, [Validators.required, Validators.pattern(GlobalConstants.nameRegex)]],
      email: [null, [Validators.required, Validators.pattern(GlobalConstants.emailRegex)]],
      contactNumber: [null, [Validators.required, Validators.pattern(GlobalConstants.contactRegex)]],
      paymentMethod: [null, [Validators.required]],
      product: [null, [Validators.required]],
      category: [null, [Validators.required]],
      quantity: [null, [Validators.required]],
      price: [null, [Validators.required]],
      total: [0, [Validators.required]],
    });
  }

  getCategories() {
    this.categorySevice.getFilteredCategories().subscribe((response) => {
      this.ngxService.stop();
      this.categories = response;
    }, (error) => {
      this.ngxService.stop();
      if(error.error?.message) {
        this.responseMessage = error.error?.message;
      } else {
        this.responseMessage = GlobalConstants.genericError;
      }
      this.snackBarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  getProductsByCategory(value:any) {
    this.productService.getProductsByCategory(value.id).subscribe((response:any) => {
      this.products = response;
      this.manageOrderForm.controls['price'].setValue('');
      this.manageOrderForm.controls['quantity'].setValue('');
      this.manageOrderForm.controls['total'].setValue(0);
    }, (error) => {
      if(error.error?.message) {
        this.responseMessage = error.error?.message;
      } else {
        this.responseMessage = GlobalConstants.genericError;
      }
      this.snackBarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  getProductDetails(value:any) {
    this.productService.getById(value.id).subscribe((response:any) => {
      this.price = response.price;
      this.manageOrderForm.controls['price'].setValue(response.price);
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.price * 1);
    }, (error) => {
      if(error.error?.message) {
        this.responseMessage = error.error?.message;
      } else {
        this.responseMessage = GlobalConstants.genericError;
      }
      this.snackBarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  setQuantity(value:any) {
    var temp = this.manageOrderForm.controls['quantity'].value;
    if(temp > 0) {
      this.manageOrderForm.controls['total'].setValue(this.manageOrderForm.controls['quantity'].value * this.manageOrderForm.controls['price'].value);
    } else if (temp != '') {
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.manageOrderForm.controls['quantity'].value * this.manageOrderForm.controls['price'].value);
    }
  }

  validateProductAdd() {
    if(this.manageOrderForm.controls['total'].value === 0 || this.manageOrderForm.controls['total'].value === null || 
        this.manageOrderForm.controls['quantity'].value <= 0) {
      return true;
    } else {
      return false;
    }
  }

  validateSubmit() {
    // if(this.totalAmount === 0 || this.manageOrderForm.controls['name'].value === null || this.manageOrderForm.controls['email'].value || 
    //     this.manageOrderForm.controls['contactNumber'].value || this.manageOrderForm.controls['paymentMethod'].value) {
    //   return false;
    // } else {
    //   return true;
    // }
    return (
      this.totalAmount === 0 || 
      !this.manageOrderForm.controls['name'].value || 
      !this.manageOrderForm.controls['email'].value || 
      !this.manageOrderForm.controls['contactNumber'].value || 
      !this.manageOrderForm.controls['paymentMethod'].value
    );
  }

  add() {
    var formData = this.manageOrderForm.value;
    var productName = this.dataSource.find((e:{id:number}) => e.id === formData.product.id);

    if(productName === undefined) {
      this.totalAmount = this.totalAmount + formData.total;

      this.dataSource.push({
        id:formData.product.id, 
        name: formData.product.name,
        category: formData.category.name,
        quantity: formData.quantity,
        price: formData.price,
        total: formData.total,
      });

      this.dataSource = [...this.dataSource];

      this.snackBarService.openSnackBar(GlobalConstants.productAdded, "success");
    } else {
      this.snackBarService.openSnackBar(GlobalConstants.productExistsError, GlobalConstants.error);
    }
  }

  handleDeleteAction(value:any, element:any) {
    this.totalAmount = this.totalAmount - element.total;
    this.dataSource.splice(value, 1);
    this.dataSource = [...this.dataSource];
  }

  submitAction() {
    var formData = this.manageOrderForm.value;
    console.log('Form Data:', formData);
    var data = {
      name: formData.name,
      email: formData.email,
      contactNumber: formData.contactNumber,
      paymentMethod: formData.paymentMethod,
      total: this.totalAmount.toString(),
      productDetails: JSON.stringify(this.dataSource),
    };

    this.ngxService.start();
    this.billService.generateReport(data).subscribe((response:any) => {
      this.downloadFile(response?.uuid);
      this.manageOrderForm.reset();
      this.dataSource = [];
      this.totalAmount = 0;
    }, (error) => {
      this.ngxService.stop();
      if(error.error?.message) {
        this.responseMessage = error.error?.message;
      } else {
        this.responseMessage = GlobalConstants.genericError;
      }
      this.snackBarService.openSnackBar(this.responseMessage, GlobalConstants.error);
    });
  }

  downloadFile(filename:string) {
    var data = {
      uuid: filename
    }

    this.billService.getPdf(data).subscribe((response:any) => {
      saveAs(response, filename + '.pdf');
      this.ngxService.stop();
    })
  }
}
