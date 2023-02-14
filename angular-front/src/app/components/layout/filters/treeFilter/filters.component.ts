import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddFilterModalComponent } from '../add-filter-modal/add-filter-modal.component';
import { LogicFilterType } from '../../../../interfaces/logic-filter-type';
import type { FilterName } from '../../../../interfaces/filters';
import { logicOperatorTitles } from '../../../../constants/filter';
import { LogicNode } from 'src/app/logic/filter/logicNode';
import { ArrayDataSource } from '@angular/cdk/collections';
import { LogicNodeFactory } from 'src/app/logic/filter/logicNodeFactory';
import { FilterOption } from 'src/app/constants/text';
import { FilterablesService } from 'src/app/services/filterables/filterables.service';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/users/user.service';

type FlatLogicNode = LogicNode<LogicFilterType, FilterName>;
let treeData: FlatLogicNode | null = null;
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent {
  @Input() public filterableType!: string;
  @Input() public filters!: FilterOption[];
  constructor(public dialog: MatDialog, private filterableDataService: FilterablesService) {}
  private filterableService$!: Subscription;
  private filterableService!: UserService<any>;
  
  public treeControl = new FlatTreeControl<FlatLogicNode>(
    node => node.level,
    node => treeData !== null && node.hasChildren(),
  );

  ngOnInit() {
    this.filterableService$ = this.filterableDataService.getService().subscribe((service) => {
      this.filterableService = service;
    });
  }

  ngOnDestroy() {
    this.filterableService$.unsubscribe();
  }

  private createDataSource() {
    return new ArrayDataSource(treeData?.toArray() ?? []);
  }
  
  public removeAllFilters() {
    treeData?.chopTree();
    treeData = null;
    this.dataSource = this.createDataSource();
  }

  public dataSource = this.createDataSource();

  public isEmptyTree() {
    return treeData === null;
  }

  private _formatValue(type: LogicFilterType, section?: string, value?: string) {
    if (type === 'LEAF' && !!section && !!value) {
      return `${section}: ${value}`;
    }    
    return `${logicOperatorTitles[type]}:`;
  }

  public shouldRender(node: FlatLogicNode) {
    const res = node.level === 0 || node.isParentExpanded();
    return res;
  }

  public expand(node: FlatLogicNode) {
    node.switchExpand();
  }

  public isExpandable(node: FlatLogicNode) {
    return node.hasChildren();
  }

  public isLeaf(node: FlatLogicNode) {
    return node.isLeaf();
  }

  public getTitle(node: FlatLogicNode) {
    return node.title;
  }

  public openDialog(node: FlatLogicNode | null = null) {
    const dialogRef = this.dialog.open(AddFilterModalComponent, {
      width: '500px',
      data: { type: null, section: null, value: null, filters: this.filters }
    });

    dialogRef.afterClosed().subscribe((result: {
        section: FilterName, type: LogicFilterType, value: string
    }) => {
        if (!result) return;
        const title = this._formatValue(result.type, result.section, result.value);
        const newNode = LogicNodeFactory.createNode(this.filterableType, result.type, result.section, result.value, title, node);
        if (node === null) { treeData = newNode; } 
        else { node.addChild(newNode); }
        this.dataSource = this.createDataSource();
    });
  }

  public onFilterClick() {
      this.filterableService.setStudentFilters(treeData);
  }

}
