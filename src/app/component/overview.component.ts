import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService, TranslationChangeEvent } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { ComponentDataService } from './component.data.service';
import { componentMap } from './component.map';
import { filterData } from './resolve-routes-config.service';
import { suggestScopeList } from './scope-list';

@Component({
  selector: 'd-components-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class ComponentsOverviewComponent implements OnInit, OnDestroy {
  srcPrefix = environment.deployPrefix + 'assets';
  imgPrefix = '';
  componentsLooking = [];
  componentsSuggest = [];
  componentsDataDisplay = [];
  componentsData = [];
  overviewText: any = {};
  themeService;
  darkMode = '';
  totalNumComponents: number;
  // 使用如下个数的元素来占位，用于将flex布局为space-between时的元素顶到前面去，形成类似grid布局的效果
  // 使用14个是因为将页面缩放至最小25%时,一行最多元素为15个,14个刚好可以将只有一个的元素顶到左边界处
  flexPlaceHolder = 14;
  flexPlaceHolders: Array<any>;
  isOpensource = false;
  nowFilter: string;
  tagList: any = [
    { title: '', name: 'newChangeCmps', checked: false },
    { title: '', name: 'recentlySuggestCmps', checked: false }
  ];

  constructor(private translate: TranslateService, private router: Router, private comDataService: ComponentDataService) {
    this.comDataService.getComData().subscribe(value => this.componentsData = value);
    this.componentsDataDisplay = cloneDeep(this.componentsData);
    this.setI18n();

    this.translate.onLangChange.subscribe((event: TranslationChangeEvent) => {
      this.componentsDataDisplay = cloneDeep(this.componentsData);
      this.setI18n();
    });
  }

  ngOnInit() {
    if (window.location.host === 'devui.design') {
      this.isOpensource = true;
    }

    this.calNumberOfComponents();
    this.setPrefix();
    this.setTheme();
    this.setComponentsSuggest(suggestScopeList);

    this.flexPlaceHolders = new Array(this.flexPlaceHolder).fill(0);
  }

  setI18n() {
    this.overviewText = this.translate.instant('public').overview;
    this.tagList.map(tag => {tag.title = this.overviewText[tag.name]; });
  }

  calNumberOfComponents() {
    this.totalNumComponents = 0;
    this.componentsData.map(components => {
      this.totalNumComponents = this.totalNumComponents + components.children.length;
    });
  }

  setPrefix() {
    this.imgPrefix = './' + this.srcPrefix + '/overview/';
  }

  setTheme() {
    if (typeof window !== 'undefined' && window['devuiThemeService']) {
      this.themeService = window['devuiThemeService'];
      if (window['devuiCurrentTheme']) {
        this.themeChange();
      }
      if (this.themeService.eventBus) {
        this.themeService.eventBus.add('themeChanged', this.themeChange);
      }
    }
  }

  setComponentsSuggest(type) {
    this.componentsSuggest = [];
    this.componentsData.map(cmpList => {
      cmpList.children.map(cmp => {
        if (Array.isArray(type) && type.find(scope => scope.toLocaleLowerCase() === cmp.lowerName)) {
          this.componentsSuggest.push(cloneDeep(cmp));
        } else if (type === 'newChange' && cmp.newChange) {
          this.componentsSuggest.push(cloneDeep(cmp));
        }
      });
    });
  }

  themeChange = () => {
    if (typeof window !== 'undefined' && window['devuiCurrentTheme'] === 'devui-dark-theme') {
      this.darkMode = '-dark';
    } else {
      this.darkMode = '';
    }
  }

  searchComponent(event) {
    this.nowFilter = undefined;
    this.tagList.map(tag => tag.checked = false);
    this.setComponentsSuggest(suggestScopeList);
    this.componentsDataDisplay = filterData(event, this.componentsData);
    this.componentsLooking = [];
    if (!this.componentsDataDisplay || !this.componentsDataDisplay.length) {
      const res = componentMap.find(cmp => {
        return cmp.matches.find(child => {
          return child.includes(event);
        });
      });
      if (res) {
        this.componentsData.map(cmpList => {
          cmpList.children.map(cmp => {
            if (res.name.includes(cmp.lowerName)) {
              this.componentsLooking.unshift(cloneDeep(cmp));
            }
          });
        });
      }
    }
  }

  filter(type) {
    const tagIndex = this.tagList.findIndex(tag => tag.name === type);
    this.tagList.map(tag => tag.checked = false);
    if (this.nowFilter !== type) {
      this.nowFilter = type;
      this.tagList[tagIndex].checked = true;
      this.componentsDataDisplay = [];
      if (type === 'newChangeCmps') {
        this.setComponentsSuggest('newChange');
      } else if (type === 'recentlySuggestCmps') {
        this.setComponentsSuggest(suggestScopeList);
      }
    } else {
      this.nowFilter = undefined;
      this.componentsDataDisplay = cloneDeep(this.componentsData);
      this.setComponentsSuggest(suggestScopeList);
    }
  }

  jumpToComponent(link) {
    this.router.navigate(['components', 'zh-cn', link]);
  }

  jumpToChangeLog(e) {
    if (!this.isOpensource) {
      e.stopPropagation();
      window.open('http://3ms.huawei.com/hi/group/3945390/wiki_6319622.html', '_blank'); // TODO: 开源版本要改成changelog的链接
    }
  }

  imgError(event) {
    const img = event.srcElement;
    img.src = this.imgPrefix + 'default.png';
    img.onerror = null;
  }

  ngOnDestroy() {
    if (this.themeService) {
      if (this.themeService.eventBus) {
        this.themeService.eventBus.remove('themeChanged', this.themeChange);
      }
    }
  }
}
