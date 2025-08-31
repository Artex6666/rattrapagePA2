<template>
    <div class="back-office">
      <!-- Menu latéral -->
      <SidebarMenu :currentPage="currentPage" @change-page="changePage" />
  
      <main class="main-content">
        <component :is="currentComponent" />
      </main>
    </div>
  </template>
  
  <script>
  import SidebarMenu from "@/components/SidebarMenu.vue"
import Dashboard from "@/views/DashboardView.vue"
import UserManagement from "@/components/UserManagement.vue"
import TruckManagement from "@/components/TruckManagement.vue"
import WarehouseManagement from "@/components/WarehouseManagement.vue"
import LoyaltyManagement from "@/components/LoyaltyManagement.vue"
import IncidentManagement from "@/components/IncidentManagement.vue"
import FranchiseManagement from "@/components/FranchiseManagement.vue"
import PayoutManagement from "@/components/PayoutManagement.vue"
import OrderManagement from "@/components/OrderManagement.vue"
import NewsletterEditor from "@/components/NewsletterEditor.vue"
import ReviewManagement from "@/components/ReviewManagement.vue"
  
  export default {
    name: "BackOffice",
    components: {
      SidebarMenu,
      Dashboard,
      UserManagement,
      FranchiseManagement,
      TruckManagement,
      WarehouseManagement,
      LoyaltyManagement,
      IncidentManagement,
      PayoutManagement,
      OrderManagement,
      Newsletter: NewsletterEditor,
      ReviewManagement
    },
    data() {
      return {
        currentPage: "dashboard" 
      }
    },
    computed: {
      currentComponent() {
        switch (this.currentPage) {
          case "dashboard":
            return Dashboard
          case "utilisateurs":
            return UserManagement
          case "franchises":
            return FranchiseManagement
          case "warehouses":
            return WarehouseManagement
          case "trucks":
            return TruckManagement
          case "loyalty":
            return LoyaltyManagement
          case "incidents":
            return IncidentManagement
          case "payouts":
            return PayoutManagement
          case "orders":
            return OrderManagement
          case "newsletter":
            return NewsletterEditor
                  case "reviews":
          return ReviewManagement
          default:
            return Dashboard
        }
      }
    },
    methods: {
      changePage(page) {
        this.currentPage = page
      }
    }
  }
  </script>
  
  <style scoped>
  .back-office {
    display: flex;
  }
  
  .main-content {
    margin-left: 240px;
    padding: 20px;
    width: calc(100% - 240px);
    min-height: 100vh;
    background-color: #f4f6f8;
  }
  </style>
  